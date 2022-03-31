{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShell rec {
  buildInputs = [
    nodejs-16_x
    yarn
    nodePackages.eslint
    nodePackages.prettier
    nodePackages.typescript
    nodePackages.typescript-language-server
    nodePackages.vscode-langservers-extracted
    patchelf

    # Lib
    libclang
    libuv
  ];

  LIBCLANG_PATH = "${libclang.lib}/lib";
  LD_LIBRARY_PATH = lib.makeLibraryPath buildInputs;
}
