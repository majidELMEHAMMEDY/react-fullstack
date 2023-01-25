import React from 'react';

const Player = ({score, current, active, nome, winner}) => {
    let panelClass = "player-panel";
    if (winner) panelClass += " winner"
    else if (active) panelClass += " player--active";
    return (
        <section className={"player "+panelClass}>
            <h2 className="name" id="name--0">{nome}</h2>
            <p className="score" id="score--0">{score}</p>
            <div className="current">
            <p className="current-label">Current</p>
            <p className="current-score" id="current--0">{current}</p>
            </div>
       </section>
    );
};

export default Player;