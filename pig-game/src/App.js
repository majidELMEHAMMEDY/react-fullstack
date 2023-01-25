import React, { Component } from "react";
//import io from "socket.io-client";

import "./App.css";
import Player from "./components/Player";

const io = require("socket.io-client");
const socket = io("http://localhost:3001", {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd",
  },
});
//const MAX_SCORE = 10;
const initState = {
  gameId: "default",
  players: {},
  dice: 0,
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = initState;

    this.rollDice = this.rollDice.bind(this);
    //this.nextPlayer = this.nextPlayer.bind(this);
    this.holdDice = this.holdDice.bind(this);
    this.newGame = this.newGame.bind(this);
  }

  componentDidMount() {
    const gameId = new URL(window.location).searchParams.get("gameId");
    this.socket = io("http://localhost:3001");
    this.setState({ gameId });
    this.socket.on("update-game", (game) => {
      this.setState(game);
    });
    this.socket.emit("join-game", gameId);
  }

  rollDice() {
    this.socket.emit("roll-dice", this.state.gameId);
  }

  holdDice() {
    this.socket.emit("hold-dice", this.state.gameId);
  }

  newGame() {
    this.socket.emit("new-game", this.state.gameId);
  }

  render() {
    let { players, dice } = this.state;
    return (
      <div>
        <main>
          {players &&
            Object.keys(players).map((key) => {
              const player = players[key];
              return (
                <Player
                  key={player.nome}
                  score={player.score}
                  current={player.current}
                  active={player.active}
                  nome={player.nome}
                  winner={player.winner}
                />
              );
            })}

          {dice !== 0 && (
            <img
              src={require(`./img/dice-${dice}.png`)}
              alt="Dice"
              className="dice"
            />
          )}
          <button onClick={this.newGame} className="btn btn--new">
            🔄 New game
          </button>
          <button onClick={this.rollDice} className="btn btn--roll">
            🎲 Roll dice
          </button>
          <button onClick={this.holdDice} className="btn btn--hold">
            📥 Hold
          </button>
        </main>
      </div>
    );
  }
}

export default App;
