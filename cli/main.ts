import { Command } from "cliffy"
import { cliRunner } from "./task/index.ts"

await new Command()
  .name("modo")
  .version("0.2.0")
  .description("Test CLI for monorepos on deno")
  .arguments("<args>")
  .option("-c, --clear", "Clear console on execute")
  .option("-d, --dir <dir:string>", "Pass in directory to be executed")
  .option("-x, --exclude <ex:string>", "Pass in directory to be excluded")
  .action(({ clear = false, dir, exclude }, ...args) => {
    cliRunner({
      dir,
      clear,
      exclude,
      command: args[0],
    })
  })
  .parse(Deno.args)
