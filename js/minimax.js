function AI(grid) {
  this.grid = grid;
  console.log(grid);
}

// evaluacion
AI.prototype.eval = function () {
  var celdasVacias = this.grid.availableCells().length;
  var smoothWeight = 0.1,
    mono = 1.0,
    vacio = 2.7,
    maximo = 1.0;

  return (
    this.grid.smoothness() * smoothWeight +
    this.grid.monotonicity2() * mono +
    Math.log(celdasVacias) * vacio +
    this.grid.maxValue() * maximo
  );
};

//  busqueda minimax
AI.prototype.search = function (depth, alpha, beta, positions, cutoffs) {
  //   console.log("res", depth, alpha, beta, positions, cutoffs);
  var bestScore;
  var bestMove = -1;
  var result;

  // el jugador maximo
  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction in [0, 1, 2, 3]) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (newGrid.isWin()) {
          return {
            move: direction,
            score: 10000,
            positions: positions,
            cutoffs: cutoffs,
          };
        }
        var newAI = new AI(newGrid);

        if (depth == 0) {
          result = { move: direction, score: newAI.eval() };
        } else {
          result = newAI.search(depth - 1, bestScore, beta, positions, cutoffs);
          if (result.score > 9900) {
            // win
            result.score--; // penalizar ligeramente una mayor profundidad de la victoria
          }
          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }
        if (bestScore > beta) {
          cutoffs++;
          return {
            move: bestMove,
            score: beta,
            positions: positions,
            cutoffs: cutoffs,
          };
        }
      }
    }
  } else {
    bestScore = beta;

    // pruebe un 2 y 4 en cada celda y mida lo molesto que es con las métricas de eval
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };
    for (var value in scores) {
      for (var i in cells) {
        scores[value].push(null);
        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cell);
      }
    }

    // ahora solo escoge los movimientos más molestos
    var maxScore = Math.max(
      Math.max.apply(null, scores[2]),
      Math.max.apply(null, scores[4])
    );
    for (var value in scores) {
      // 2 and 4
      for (var i = 0; i < scores[value].length; i++) {
        if (scores[value][i] == maxScore) {
          candidates.push({ position: cells[i], value: parseInt(value, 10) });
        }
      }
    }

    // buscar en cada candidato
    for (var i = 0; i < candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return {
          move: null,
          score: alpha,
          positions: positions,
          cutoffs: cutoffs,
        };
      }
    }
  }

  return {
    move: bestMove,
    score: bestScore,
    positions: positions,
    cutoffs: cutoffs,
  };
};

// realiza una búsqueda y devuelve el mejor movimiento
AI.prototype.getBest = function () {
  return this.iterativeDeep();
};

// realiza una profundización iterativa sobre la búsqueda
AI.prototype.iterativeDeep = function () {
  var start = new Date().getTime();
  var depth = 0;
  var best;
  do {
    var newBest = this.search(depth, -10000, 10000, 0, 0);
    if (newBest.move == -1) {
      break;
    } else {
      best = newBest;
    }
    depth++;
  } while (new Date().getTime() - start < minSearchTime);
  return best;
};

AI.prototype.translate = function (move) {
  return {
    0: "up",
    1: "right",
    2: "down",
    3: "left",
  }[move];
};
