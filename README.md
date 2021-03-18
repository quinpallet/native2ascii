# native2ascii
native2ascii written in TypeScript(Deno)

## Prerequisites

- [Deno](https://github.com/denoland/deno) >= 1.7.0

## Usage

    Usage: deno run --allow-read [--allow-write] native2ascii.ts [options] [inputfile [outputfile]]
    
    OPTIONS:
     --reverse                          Perform the reverse operation; ascii2native
     --ignore-comments[=comment-type]   Do not convert the comment part
                                        The comment-type string must be the name of the programming language


``` bash
# Converts UTF-8 encoded file to ASCII encoding, outputs to stdout
$ deno run --allow-read native2ascii.ts utf8-encoded.properties

# Converts Java file (UTF-8 encoding) except in the comment area, outputs to a file
$ deno run --allow-read --allow-write native2ascii.ts --ignore-comments utf8-encoded.java ascii-encoded.java

# Converts Python file (UTF-8 encoding) except the comment area, outputs to stdout
$ deno run --allow-read native2ascii.ts --ignore-comments=python utf8-encoded.py

# Converts ASCII encoded file to UTF-8 encoding, outputs to a file
$ deno run --allow-read --allow-write native2ascii.ts --reverse ascii-encoded.properties utf8-encoded.properties
```

## License

&copy; 2021 [Ken Kurosaki](https://github.com/quinpallet).  
This project is [MIT](https://github.com/quinpallet/native2ascii/blob/master/LICENSE) licensed.
