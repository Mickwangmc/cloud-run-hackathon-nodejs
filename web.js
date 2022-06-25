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

  const { x: myX, y: myY, direction: myDirection } = state[myId];

  const enemyIds = Object.keys(state).filter(id => id !== myId);

  let targetAt = null;

  // 1. Check is any enemy in hit range. If has, track its direction
  enemyIds.forEach(id => {
    const targetState = state[id];

    if (myY - targetState.y <= 3) {
      targetAt === "N"
    } else if (myX - targetState.x <= 3) {
      targetAt === "E"
    } else if (targetState.x - myX <= 3) {
      targetAt === "W"
    } else if (targetState.y - myY <= 3) {
      targetAt === "S"
    }
  })
  console.log(`>> targetAt: ${targetAt}`);
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
    // 4. Maybe could chase the nearest one?
    // consider dimension and my position, and my direction
    const moves = ['F', 'L', 'R'];
    res.send(moves[Math.floor(Math.random() * moves.length)]);
  }
});

app.listen(process.env.PORT || 8080);
