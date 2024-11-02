import { Command } from "cliffy"
import { cliRunner } from "./cli/index.ts"

await new Command()
  .name("modo")
  .version("0.1.0")
  .description("Test CLI for monorepos on deno")
  .arguments("[...args:string]")
  .option("-c, --clear", "Clear console on execute")
  .option("-d, --dir <dir:string>", "Pass in directory to be executed")
  .action(({ clear = false, dir }, ...args) => {
    cliRunner({
      dir,
      clear,
      command: args[0],
    })
  })
  .parse(Deno.args)
