const { spawn } = require('node:child_process');
const { createBuilder, targetFromTargetString } = require('@angular-devkit/architect');

function createBackendProcess(command, workspaceRoot, logger, onFailure) {
  if (!command) {
    return { process: null, exitPromise: Promise.resolve(0) };
  }

  const backend = spawn(command, {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: true,
  });

  let exitResolve;
  const exitPromise = new Promise((resolve) => {
    exitResolve = resolve;
  });

  backend.on('exit', (code, signal) => {
    if (typeof code === 'number' && code !== 0) {
      logger.error(`Backend process exited with code ${code}.`);
      if (onFailure) {
        onFailure();
      }
    } else if (signal) {
      if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
        logger.warn(`Backend process stopped with signal ${signal}.`);
      }
    }

    exitResolve(typeof code === 'number' ? code : 0);
  });

  backend.on('error', (err) => {
    logger.error(`Failed to start backend process: ${err.message}`);
    if (onFailure) {
      onFailure();
    }
    exitResolve(1);
  });

  return { process: backend, exitPromise };
}

async function runCombinedBuilder(options, context) {
  const logger = context.logger;
  const workspaceRoot = context.workspaceRoot;
  const backendCommand = options.backendCommand;

  let frontendRun;
  const { process: backendProcess, exitPromise: backendExit } = createBackendProcess(
    backendCommand,
    workspaceRoot,
    logger,
    () => {
      if (frontendRun) {
        frontendRun.stop();
      }
    },
  );

  if (backendProcess) {
    context.addTeardown(() => {
      if (!backendProcess.killed) {
        backendProcess.kill();
      }
    });
  }

  const frontendTarget = targetFromTargetString(options.frontendTarget);
  frontendRun = await context.scheduleTarget(frontendTarget);
  const frontendResult = await frontendRun.result;

  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }

  const backendExitCode = await backendExit;
  await frontendRun.stop();

  const success = frontendResult?.success !== false && backendExitCode === 0;

  return { success };
}

module.exports = createBuilder(runCombinedBuilder);
