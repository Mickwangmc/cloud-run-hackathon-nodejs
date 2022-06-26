const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const DIRECTIONS = ["N", "E", "S", "W"]; // clockwise

const getNextDirection = (myDirection, direction) => {
  const currentIndex = DIRECTIONS.findIndex(ele => ele === myDirection);

  if (direction === "RIGHT") {
    if (currentIndex === DIRECTIONS.length - 1) {
      return DIRECTIONS[0];
    } else {
      return DIRECTIONS[currentIndex + 1];
    }
  } else {
    if (currentIndex === 0) {
      return DIRECTIONS[DIRECTIONS.length - 1];
    } else {
      return DIRECTIONS[currentIndex - 1];
    }
  }
}

const getBasicMove = (myX, myY, myDirection, w, h) => {
  // Check is able MOVE FORWARD or not. If not, turn direction.
  // !! This will go around edge till encounter enemy
  if (myX === 0 && myDirection === "W") {
    // At the left edege
    return myY === 0 ? "L" : "R"
  } else if (myX + 1 === w && myDirection === "E") {
    // At the right edge
    return myY === 0 ? "R" : "L"
  } else if (myY === 0 && myDirection === "N") {
    // At the top edge
    return myX + 1 === w ? "L" : "R"
  } else if (myY + 1 === h && myDirection === "S") {
    // At the bottom edge
    return myX + 1 === w ? "R" : "L"
  } else {
    return "F"
  }
}

const getInitialHinder = (myX, myY, w, h) => {
  let result = [];

  if (myX === 0) {
    result.push("W");
  }

  if (myX + 1 === w) {
    result.push("E");
  }

  if (myY === 0) {
    result.push("N");
  }

  if (myY + 1 === h) {
    result.push("S");
  };

  return result;
};

app.use(bodyParser.json());

app.get('/', function (req, res) {
  const time = new Date();
  res.send('Let the battle begin! Build time:' + time.toTimeString());
});

app.post('/', function (req, res) {
  // console.log(req.body);

  const {
    _links: { self: { href: myId } },
    arena: { dims, state }
  } = req.body;

  const { x: myX, y: myY, direction: myDirection, wasHit } = state[myId];
  const myRightDirection = getNextDirection(myDirection, "RIGHT");
  const myLeftDirection = getNextDirection(myDirection, "LEFT");
  const myBasicMove = getBasicMove(myX, myY, myDirection, dims[0], dims[1])
  const enemyIds = Object.keys(state).filter(id => id !== myId);

  let hasTargetInFront = false;
  let targetDirection = [];  // possible targets
  let hinderDirection = getInitialHinder(myX, myY, dims[0], dims[1]); // hinder my fallback

  console.log(`> myX: ${myX}, myY: ${myY}, myDirection: ${myDirection}, wasHit: ${wasHit}`)
  console.log(`> myRightDirection: ${myRightDirection}, myLeftDirection: ${myLeftDirection}, myBasicMove: ${myBasicMove}`)

  // 1. Check if any one in my range and direction
  enemyIds.forEach(id => {
    const { x: targetX, y: targetY } = state[id];

    if (myY > targetY && (myY - targetY <= 3) && myX === targetX) {
      // "N"
      if (myDirection === "N") hasTargetInFront = true;
      if (!targetDirection.includes("N")) targetDirection.push("N");
      if (myY - targetY === 1 && !hinderDirection.includes("N")) hinderDirection.push("N");
    } else if (targetX > myX && (targetX - myX <= 3) && myY === targetY) {
      // "E"
      if (myDirection === "E") hasTargetInFront = true;
      if (!targetDirection.includes("E")) targetDirection.push("E");
      if (targetX - myX === 1 && !hinderDirection.includes("E")) hinderDirection.push("E");
    } else if (myX > targetX && (myX - targetX <= 3) && myY === targetY) {
      // "W"
      if (myDirection === "W") hasTargetInFront = true;
      if (!targetDirection.includes("W")) targetDirection.push("W");
      if (myX - targetX === 1 && !hinderDirection.includes("W")) hinderDirection.push("W");
    } else if (targetY > myY && (targetY - myY <= 3) && myX === targetX) {
      // "S"
      if (myDirection === "S") hasTargetInFront = true;
      if (!targetDirection.includes("S")) targetDirection.push("S");
      if (targetY - myY === 1 && !hinderDirection.includes("S")) hinderDirection.push("S");
    }
  })
  console.log(`>> hasTargetInFront: ${hasTargetInFront}`)
  console.log(`>> targetDirection: ${targetDirection.join(",")}`);
  console.log(`>> hinderDirection: ${hinderDirection.join(",")}`);

  // 2. Decide run or hit
  if (wasHit) {
    // 2-1. Now is under attack
    if (hinderDirection.length === DIRECTIONS.length) {
      // 2-1-1. Blocked every where, let's hit
      res.send("T");
      return;
    } else if (hinderDirection.includes(myDirection)) {
      // 2-1-2. FRONT is blocked, find other way to run
      // If RIGHT hand side is blocked, TURN LEFT, otherwitse TURN RIGHT
      res.send(hinderDirection.includes(myRightDirection) ? "L" : "R")
      return;
    } else {
      // 2-1-3. FRONT is clear, adopt basic move.
      res.send(myBasicMove);
      return;
    }
  }

  if (hasTargetInFront) {
    // 2-2. Now is not under attack, if has any target in FRONT, hit!
    res.send("T");
    return;
  }

  if (targetDirection.length > 0) {
    // 2-3. No target in FRONT, but other direction has
    if (targetDirection.includes(myRightDirection)) {
      // RIGHT has
      res.send("R");
      return;
    } else {
      // (this includes targetDirection.includes(myLeftDirection) )
      // LEFT or BACK has
      res.send("L");
      return;
    }
  }

  // 3. No target in any direction, basic move
  // 4. Maybe could chase the nearest one?
  res.send(myBasicMove);

  // const moves = ['F', 'L', 'R'];
  // res.send(moves[Math.floor(Math.random() * moves.length)]);
});

app.listen(process.env.PORT || 8080);
