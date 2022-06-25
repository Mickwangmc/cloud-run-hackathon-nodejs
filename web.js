const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const DIRECTIONS = ["N", "E", "S", "W"]; // clockwise

app.use(bodyParser.json());

app.get('/', function (req, res) {
  const time = new Date();
  res.send('Let the battle begin! Build time:' + time.toTimeString());
});

app.post('/', function (req, res) {
  console.log(req.body);

  const {
    _links: { self: { href: myId } },
    arena: { dims, state }
  } = req.body;

  const { x: myX, y: myY, direction: myDirection, wasHit } = state[myId];

  if (wasHit) {
    // TODO: check direction
    const moves = ['F', 'L', 'R'];
    res.send(moves[Math.floor(Math.random() * moves.length)]);
  }

  const enemyIds = Object.keys(state).filter(id => id !== myId);

  let targetAt = null;
  let targetDirection = [];
  console.log(`> myX: ${myX}, myY: ${myY}, myDirection: ${myDirection}`)

  // 1. Check is any enemy in hit range. If has, track its direction

  enemyIds.forEach(id => {
    const { x: targetX, y: targetY } = state[id];

    if (myY - targetY <= 3 && myX === targetX) {
      targetAt = "N"
      targetDirection.push("N");
    } else if (targetX - myX <= 3 && myY === targetY) {
      targetAt = "E"
      targetDirection.push("E");
    } else if (myX - targetX <= 3 && myY === targetY) {
      targetAt = "W"
      targetDirection.push("W");
    } else if (targetY - myY <= 3 && myX === targetX) {
      targetAt = "S"
      targetDirection.push("S");
    }
  })
  console.log(`>> targetAt: ${targetAt}`);
  console.log(`>> targetDirection: ${targetDirection.join(",")}`);

  if (targetAt) {
    // 2. If any enemy target in hit range, decide hit or turn direction to it.
    const myDirectionIndex = DIRECTIONS.findIndex(ele => ele === myDirection);
    const targetDirectionIndex = DIRECTIONS.findIndex(ele => ele === targetAt);
    const diff = myDirectionIndex - targetDirectionIndex;
    console.log(`>> diff: ${diff}`)
    if (diff === 0) {
      // 2-1. In FRONT of me
      res.send("T");
    } else if (diff === 1) {
      // 2-2. On my LEFT
      res.send("L");
    } else {
      // 2-3. On my RIGHT or BACK
      res.send("R");
    }
  } else {
    // 3. If no any enemy in attack range, decide go forward or turn direction
    // TODO: to the direction without any enemy
    // 4. Maybe could chase the nearest one?
    // consider dimension and my position, and my direction
    const moves = ['F', 'L', 'R'];
    res.send(moves[Math.floor(Math.random() * moves.length)]);
  }
});

app.listen(process.env.PORT || 8080);
