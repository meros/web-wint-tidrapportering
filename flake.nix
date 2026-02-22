{
  description = "Wint Time Reporting PWA";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_22;

        # Build the Vite frontend + collect production server
        wint-app = pkgs.buildNpmPackage {
          pname = "wint-time";
          version = "0.1.0";
          src = ./.;
          inherit nodejs;

          # Update with: nix shell nixpkgs#prefetch-npm-deps -c prefetch-npm-deps package-lock.json
          npmDepsHash = "sha256-H5nQRJXINmP9RXAUwzv9UhUKyCk2TPaUsAbKLKTWuz4=";

          # Runs "npm run build" → tsc -b && vite build → dist/
          npmBuildScript = "build";

          # Collect only what production needs
          installPhase = ''
            runHook preInstall
            mkdir -p $out/lib/wint-time
            cp -r dist $out/lib/wint-time/dist
            cp server.mjs $out/lib/wint-time/server.mjs
            runHook postInstall
          '';
          dontNpmInstall = true;
        };

        # Minimal Docker image via Nix
        container = pkgs.dockerTools.streamLayeredImage {
          name = "wint-time";
          tag = "latest";
          maxLayers = 120;

          contents = [
            wint-app
            nodejs
            pkgs.cacert              # HTTPS for API proxy
            pkgs.iana-etc            # /etc/protocols, /etc/services
            pkgs.dockerTools.fakeNss # /etc/passwd for non-root
          ];

          fakeRootCommands = ''
            mkdir -p ./tmp
          '';

          config = {
            Cmd = [ "${nodejs}/bin/node" "${wint-app}/lib/wint-time/server.mjs" ];
            Env = [
              "NODE_ENV=production"
              "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            ];
            ExposedPorts = { "8080/tcp" = {}; };
            User = "nobody:nobody";
          };
        };

      in {
        packages = {
          default = wint-app;
          inherit container;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [
            nodejs
            pkgs.pnpm
            pkgs.prefetch-npm-deps
          ];
        };
      }
    );
}
