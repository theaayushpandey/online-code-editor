// id      -> the language id Judge0 uses to pick a compiler
// monaco  -> the name Monaco uses for syntax highlighting
// template-> starter code shown when the language is selected
export const LANGUAGES = [
  {
    id: 105,
    name: 'C++ (GCC 14)',
    monaco: 'cpp',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string name;
    getline(cin, name);
    cout << "Hello, " << (name.empty() ? "World" : name) << "!" << endl;
    return 0;
}
`,
  },
  {
    id: 103,
    name: 'C (GCC 14)',
    monaco: 'c',
    template: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
  {
    id: 113,
    name: 'Python 3.14',
    monaco: 'python',
    template: `import sys

name = sys.stdin.readline().strip()
print(f"Hello, {name or 'World'}!")
`,
  },
  {
    id: 91,
    name: 'Java 17',
    monaco: 'java',
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  {
    id: 102,
    name: 'JavaScript (Node 22)',
    monaco: 'javascript',
    template: `console.log("Hello, World!");
`,
  },
  {
    id: 101,
    name: 'TypeScript 5.6',
    monaco: 'typescript',
    template: `const greeting: string = "Hello, World!";
console.log(greeting);
`,
  },
  {
    id: 107,
    name: 'Go 1.23',
    monaco: 'go',
    template: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
  },
  {
    id: 108,
    name: 'Rust 1.85',
    monaco: 'rust',
    template: `fn main() {
    println!("Hello, World!");
}
`,
  },
  {
    id: 111,
    name: 'Kotlin 2.1',
    monaco: 'kotlin',
    template: `fun main() {
    println("Hello, World!")
}
`,
  },
  {
    id: 51,
    name: 'C# (Mono 6.6)',
    monaco: 'csharp',
    template: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}
`,
  },
  {
    id: 98,
    name: 'PHP 8.3',
    monaco: 'php',
    template: `<?php
echo "Hello, World!\\n";
`,
  },
  {
    id: 72,
    name: 'Ruby 2.7',
    monaco: 'ruby',
    template: `puts "Hello, World!"
`,
  },
]
