# Planning Poker

Open source implementation of planning poker game.

- The game has three roles: admin, players, observers.
- Cards: 0, 0.5, 1, 2, 3, 5, 10, 20 (gonna make it configurable)
- Self-contained, can be run in closed intranet environments.

The project is built on Angular 5. It uses [http-shared-storage](https://github.com/yarosla/httpstorage) 
backend to store session data.

## Quick Start

1. Download release archive from [Releases](https://github.com/yarosla/poker/releases) page. Unpack it.
2. Run commands:

        cd poker-release
        java -jar http-shared-storage-1.0.jar -P 8080 -s poker
    
3. Point your browser to `http://localhost:8080/index.html`

Technologies
------------

- Angular 5

Author
------

Yaroslav Stavnichiy <yarosla@gmail.com>
