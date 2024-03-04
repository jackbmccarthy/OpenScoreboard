# Open Scoreboard

Open Scoreboard provides a platform for providing web based overlays to sport live streams. Using the platform's editor, based off of [GrapesJS](https://github.com/GrapesJS/grapesjs), the user has full control of their scoreboards' presentation, with drag and droppable smart components.

This project is made of 4 different components:
    
1. **App** -- Where Tables/Courts/Team Matches are created, and the score is kept.
2. **Editor** -- Scoreboards are created and designed.
3. **Scoreboard** -- Where the overlay URL is provided for the live stream.
4. **Server** -- Serves the web pages, and offers two different database configurations:

    * **Firebase**
    * [**Acebase**](https://github.com/appy-one/acebase) -- A local database


## Getting Started
1. Clone this repo to your local computer.
2. Install all the dependancies
``` shell
    npm install
    npm run preinstall
```
3. Run the application in development mode.
``` shell
    npm run dev
```
4. Open [http://localhost:3000](http://localhost:3000) Ports 3000, 3001, and 3002, must not currently be used, or this process will fail.


## Supported Sports

* Table Tennis
* Pickleball

## Non-supported Sports

**Officially** only the sports above are supported, however, any sport with a similar scoring system can be use this project. 

Sports with **Unsupported** systems, but could be added with contributions from the community.
* Tennis Scoring
    * Would require a sub-score ability, sets won, and current set score.
* Golf Scoring
    * Negatives and Per Person score lists are not supported, only game/matches.
* Clock/Timer
    * Amount of time remaining in the half/quarter, there is no mechanism for this currently.


## License

[GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)