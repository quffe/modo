import { existsSync } from "@std/fs"
import chalk from "chalk"
import { mergeReadableStreams } from "merge-readable-streams"

interface DenoJsonData {
  url: string
  data: {
    title?: string
    name?: string
    tasks?: Record<string, string>
  }
}

interface ParsedDenoJsonData {
  name: string
  url: string
}

interface ReducedPromise {
  promises: Array<Promise<void>>
  cc: number
}

const colors: string[] = [
  "#89DDFF",
  "#5DE4C7",
  "#FFFAC2",
  "#B298F2",
  "#FAE4FC",
  "#A6ACCD",
  "#90EE90",
  "#ADD7FF",
] as const

const prefixLog = {
  ERROR: "[ERROR]",
} as const

async function readDenoJsonFiles(
  filePaths: string[],
): Promise<DenoJsonData[]> {
  const fileContents: DenoJsonData[] = []

  for (const filePath of filePaths) {
    try {
      const fileContent = await Deno.readTextFile(`${filePath}/deno.json`)
      const jsonData = JSON.parse(fileContent)
      fileContents.push({ url: filePath, data: jsonData })
    } catch (error) {
      console.error(
        chalk.red(prefixLog.ERROR),
        `Problem reading file "${filePath}"`,
        error,
      )
    }
  }

  return fileContents
}

const textDecoder = new TextDecoder("utf-8")

const logChunk = (prefix: string, str: string | Uint8Array) => {
  const message = typeof str === "string"
    ? str
    : textDecoder.decode(str, { stream: true })
  message.split("\n").forEach((val, idx, arr) => {
    if (idx !== arr.length - 1) {
      console.log(prefix, val)
    }
  })
}

export const cliRunner = async (
  { dir, command, clear }: { dir?: string; command: string; clear: boolean },
) => {
  if (clear) {
    console.clear()
  }

  const rootCwd = Deno.cwd()
  const denoConfigPath = `${rootCwd}/deno.json`

  if (!existsSync(denoConfigPath)) {
    console.error(
      chalk.red(prefixLog.ERROR),
      "deno.json not found in the current working directory",
    )
    Deno.exit(1)
  }

  const denoConfigText = await Deno.readTextFile(denoConfigPath)
  const denoConfig = JSON.parse(denoConfigText) as {
    workspace?: string[]
  }

  const workspaces = denoConfig.workspace

  if (!workspaces?.length || workspaces.length === 0) {
    console.error(
      chalk.red(prefixLog.ERROR),
      "No workspace found in deno.json",
    )
    Deno.exit(1)
  }

  const denoJsonFiles = (await readDenoJsonFiles(workspaces))
    .filter((val) => {
      const name = val.data.name || val.data.title || val.url
      return dir ? name === dir : true
    })

  if (denoJsonFiles.length === 0 && dir) {
    console.error(
      chalk.red(prefixLog.ERROR),
      `"${dir}" project not found`,
    )
    Deno.exit(1)
  }

  const DirWithCommand = denoJsonFiles.reduce((prev, curr) => {
    const name = `[${curr.data?.name || curr.data?.title || curr.url}]`
    if (curr.data?.tasks && curr.data.tasks[command]) {
      return [...prev, {
        name,
        url: curr.url,
      }]
    } else {
      console.warn(
        chalk.yellow(name),
        `Task "${command}" not found`,
      )
      return prev
    }
  }, [] as ParsedDenoJsonData[])

  if (DirWithCommand.length === 0) {
    console.error(
      chalk.red(prefixLog.ERROR),
      `"${command} is not found in any directory"`,
    )
    Deno.exit(1)
  }

  const { promises }: ReducedPromise = DirWithCommand.reduce(
    (prev: ReducedPromise, { url: cwd, name }) => {
      const chalkName = chalk.bgBlack.hex(colors[prev.cc])
      const prefix = chalkName(name)

      // Start the server in a separate async function
      const promise = (async () => {
        const cmd = new Deno.Command(Deno.execPath(), {
          args: ["task", command],
          cwd,
          stderr: "piped",
          stdout: "piped",
        })
        const { status, stdout, stderr } = cmd.spawn()

        await mergeReadableStreams(stdout, stderr)
          .pipeTo(
            new WritableStream<Uint8Array>(
              {
                write(chunk) {
                  return new Promise((resolve) => {
                    logChunk(prefix, chunk)
                    resolve()
                  })
                },
                abort(err) {
                  console.error(chalkName(prefix), `${err}`)
                },
              },
            ),
          )

        const { success } = await status
        if (!success) {
          console.error(chalkName(prefix), `Failed to run task "${command}".`)
          Deno.exit(1)
        }
      })()

      return {
        promises: [...prev.promises, promise],
        cc: prev.cc < colors.length - 1 ? prev.cc + 1 : 0,
      }
    },
    { promises: [], cc: 0 },
  )

  // Wait for all servers to finish
  await Promise.all(promises)
}
