const board = document.getElementById('board');
const message = document.getElementById('message');
let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;

function handleCellClick(e) {
    const cell = e.target;
    const index = cell.dataset.index;
    if (gameBoard[index] !== '' || !gameActive) return;
    gameBoard[index] = currentPlayer;
    cell.textContent = currentPlayer;
    checkWinner();
    if (gameActive) {
        currentPlayer = 'O';
        makeBotMove();
    }
}

function checkWinner() {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            message.textContent = `Player ${gameBoard[a]} wins!`;
            gameActive = false;
            return;
        }
    }
    if (!gameBoard.includes('')) {
        message.textContent = "It's a draw!";
        gameActive = false;
    }
}

function makeBotMove() {
  if (!gameActive) return;
    let bestMove = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = 'O';
            let score = minimax(gameBoard, 0, false);
            gameBoard[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
     if(bestMove !== -1){
        gameBoard[bestMove] = 'O';
        document.querySelector(`[data-index='${bestMove}']`).textContent = 'O';
        checkWinner();
        currentPlayer = 'X';
    }
}

function minimax(board, depth, isMaximizing) {
    const scores = {
        X: -1,
        O: 1,
        draw: 0
    };
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const combo of winningCombos) {
        const [a, b, c] = combo;
         if (board[a] && board[a] === board[b] && board[a] === board[c]) {
           return scores[board[a]];
        }
    }
      if (!board.includes('')) {
          return scores.draw;
      }

    if(isMaximizing){
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore
    } else {
         let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                 board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore
    }
}


board.addEventListener('click', handleCellClick);
