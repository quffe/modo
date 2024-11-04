# MoDO

**Mo**norepo **D**en**o** is another cli for deno monorepo inspired by
[Spino](https://github.com/rsm-hcd/spino),
[monodeno](https://jsr.io/@jurassicjs/monodeno)

## Motivation

~~I love monorepo, I love Deno thats all motivation I need.~~

I experimented with both Spino and Monodeno for our new Deno monorepo and found
features I like in both of them. In this CLI, I'd like to combine the both tools
and add a feature that they missed. Which is the ability to run scripts on a
specific project on root dir.

## Installation

To add into your project you'll need to add this in your root `deno.json` file

```diff
// deno.json
{
  "tasks": {
+   "modo": "deno run -A jsr:@quffe/modo"
  }
}
```

## Usage

```bash
deno task modo [task]
```

**Options:** 
`-h, --help` 
- Show this help. 
`-V, --version`
- Show the version number for this program. 
`-c, --clear`
- Clear console on execute
`-d, --dir <dir>`
- Pass in directory to be executed

> **Note:** `<dir>` depends on your projects `name || title || url` so if your
> project has name it will use it

## Sample commands

Running task on all projects

```bash
deno task modo build
```

Running task on specific project

```bash
deno task modo -d @apps/test dev
```

## Roadmap

- Add `init` to create deno based on framework?
- Add more colors?
