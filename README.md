# Planning Poker

Open source implementation of planning poker game.

- The game has three roles: admin, players, observers.
- Multiple card decks configurable via `config.json`
- Self-contained, can be run in closed intranet environments.

## Quick Start

1. Download release archive from [Releases](https://github.com/yarosla/poker/releases) page. Unpack it.
2. Run commands:

        cd poker-release
        java -jar http-shared-storage-1.0.jar -P 8080 -s poker
    
3. Point your browser to `http://localhost:8080/index.html`

## Technologies

The project is built on Angular 5. It uses [http-shared-storage](https://github.com/yarosla/httpstorage) 
backend to store session data.

## Author

Yaroslav Stavnichiy <yarosla@gmail.com>
