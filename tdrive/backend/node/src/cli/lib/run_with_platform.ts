import ora from "ora";

import config from "../../core/config";
import tdrive from "../../tdrive";
import gr from "../../services/global-resolver";
import type { TdrivePlatform } from "../../core/platform/platform";

//TODO: When this gets used for all commands; update verboseDuringRun from search/index-all and move to root index

/**
 * Start the platform and its services, run the command (passed as
 * the `handler` callback), then cleanly shut down the platform.
 * @param prefix Prefix text to set on the Ora spinner
 * @param handler Callback to run the actual command.
 *    - If it returns a number, that will be the exit code of the process.
 *    - No attempt to catch errors is done here. If it throws, the platform
 *      shutdown will be skipped and normal unhandled exception stuff will go on.
 */
export default async function runWithPlatform(
  prefix: string,
  handler: (args: {
    spinner: ora.Ora;
    config: config.IConfig;
    platform: TdrivePlatform;
  }) => Promise<number | undefined> | Promise<void>,
) {
  const spinner = ora({ prefixText: prefix + " >" });
  spinner.start("Platform: starting...");
  const platform = await tdrive.run(config.get("services"));
  await gr.doInit(platform);
  spinner.succeed("Platform: started");
  const exitCode = await handler({ spinner, config, platform });
  if (typeof exitCode === "number") process.exitCode = exitCode;
  spinner.start("Platform: shutting down...");
  await platform.stop();
  spinner.succeed("Platform: shutdown");
  spinner.stop();
}
