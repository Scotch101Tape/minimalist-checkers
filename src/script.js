const COLOR = {
  WHITE: 10,
  BLACK: 11
}

const BOARD_VALUE = {
  WHITE: 1,
  WHITE_KING: 3,
  BLACK: 2,
  BLACK_KING: 4,
  NONE: 0,
}

const DISPLAY_VALUE = {
  WHITE: BOARD_VALUE.WHITE,
  BLACK: BOARD_VALUE.BLACK,
  NONE: BOARD_VALUE.NONE,
  WHITE_KING: BOARD_VALUE.WHITE_KING,
  BLACK_KING: BOARD_VALUE.BLACK_KING,
  POSSIBLE_WHITE: 5,
  POSSIBLE_BLACK: 6,
}

const BINDINGS_VALUE = {
  MOVE: 0,
  PAWN: 1,
  KING: 2,
  NONE: 3,
}

const BOARD_HTML = {
  ROOF: "---",
  WALL: "|",
  CORNER: " ",
  NEWLINE: "\n",
}

const DISPLAY_HTML = {
  [DISPLAY_VALUE.NONE]: "   ",
  [DISPLAY_VALUE.WHITE]: " <span class='pawn white-pawn'>O</span> ",
  [DISPLAY_VALUE.BLACK]: " <span class='pawn black-pawn'>X</span> ",
  [DISPLAY_VALUE.WHITE_KING]: "<span class='pawn white-king'>OOO</span>",
  [DISPLAY_VALUE.BLACK_KING]: "<span class='pawn black-king'>XXX</span>",
  [DISPLAY_VALUE.POSSIBLE_WHITE]: " <span class='pawn possible-white-pawn'>?</span> ",
  [DISPLAY_VALUE.POSSIBLE_BLACK]: " <span class='pawn possible-black-pawn'>?</span> ",
}

const BINDINGS_HTML = {
  [BINDINGS_VALUE.NONE]: ({inside, bindings_value}) => inside,
  // TODO: make these javascript bindings do stuff/pass values
  // TODO: make this work lol
  [BINDINGS_VALUE.MOVE]: ({inside, bindings_value}) => `<a href='javascript:move_click({move: ${JSON.stringify(bindings_value.move)}})' class='move-binding'>${inside}</a>`,
  [BINDINGS_VALUE.PAWN]: ({inside, bindings_value}) => `<a href='javascript:pawn_click({pawn: ${JSON.stringify(bindings_value.pawn)}})' class='pawn-binding'>${inside}</a>`,
  [BINDINGS_VALUE.KING]: ({inside, bindings_value}) => `<a href='javascript:pawn_click({pawn: ${JSON.stringify(bindings_value.pawn)}})' class='pawn-binding'>${inside}</a>`,
}

let the_board = [
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 2, 0, 2, 0, 2],
  [2, 0, 2, 0, 2, 0, 2, 0],
  [0, 2, 0, 2, 0, 2, 0, 2],
]
let the_winner
let the_turn = COLOR.WHITE

let board_element
let turn_element

function create_display({board, turn, winner, moves, double_jump}) {
  let display = JSON.parse(JSON.stringify(board))

  const move_value = turn === COLOR.WHITE ? DISPLAY_VALUE.POSSIBLE_WHITE : DISPLAY_VALUE.POSSIBLE_BLACK
  for (const move of moves) {
    display[move.end[0]][move.end[1]] = move_value
  }

  return display
}

function create_bindings({board, turn, winner, moves, double_jump}) {
  let bindings = []
  for (let r = 0; r < 8; r++) {
    bindings.push([])
    for (let c = 0; c < 8; c++) {
      bindings[r].push({
        kind: BINDINGS_VALUE.NONE
      })
    }
  }

  // Only bind if there is no winner
  if (winner === undefined) {
    if (!double_jump) {
      const turn_pawn = turn === COLOR.WHITE ? BOARD_VALUE.WHITE : BOARD_VALUE.BLACK
      const turn_king = turn === COLOR.WHITE ? BOARD_VALUE.WHITE_KING : BOARD_VALUE.BLACK_KING
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c] === turn_pawn) {
            bindings[r][c] = {
              kind: BINDINGS_VALUE.PAWN,
              pawn: {
                r,
                c,
                color: turn,
                rank: "normal",
              }
            }
          } else if (board[r][c] === turn_king) {
            bindings[r][c] = {
              kind: BINDINGS_VALUE.PAWN,
              pawn: {
                r,
                c,
                color: turn,
                rank: "king",
              }
            }
          }
        }
      }
    } else {
      // In the case of the double jump, the first move *should* be representive of what we want
      const move = moves[0]

      bindings[move.start[0]][move.start[1]] = {
        kind: BINDINGS_VALUE.MOVE,
        move: {
          kind: "normal",
          start: move.start,
          end: move.start,
          color: move.color,
          rank: move.rank,
        }
      }
    }

    for (const move of moves) {
      bindings[move.end[0]][move.end[1]] = {
        kind: BINDINGS_VALUE.MOVE,
        move,
      }
      // Problematic, removing for now, debinds the current peice being considered
      // better to make a selction graphic
      // YESSS, because that the only thing I care about when it comes to doing this in bindings
      /*bindings[move.start[0]][move.start[1]] = {
        kind: BINDINGS_VALUE.NONE,
      }*/
    }
  }

  return bindings
}

function create_html_string({display, bindings}) {
  let s = ""

  let empty_line = ""
  for (let i = 0; i < 8; i++) {
    empty_line += BOARD_HTML.CORNER + BOARD_HTML.ROOF
  }
  empty_line += BOARD_HTML.CORNER + BOARD_HTML.NEWLINE

  for (let r = 0; r < 8; r++) {
    s += empty_line
    for (let c = 0; c < 8; c++) {
      const display_value = display[r][c]
      const bindings_value = bindings[r][c]

      const display_html = DISPLAY_HTML[display_value]
      const bindings_html = BINDINGS_HTML[bindings_value.kind]

      const cell_html = bindings_html({
        inside: display_html,
        bindings_value,
      })
      s += BOARD_HTML.WALL + cell_html//+ (cell_value === BOARD_VALUE.WHITE ? BOARD_TEXT.WHITE(r, c) : (cell_value === BOARD_VALUE.BLACK ? BOARD_TEXT.BLACK(r, c) : BOARD_TEXT.EMPTY))
    }
    s += BOARD_HTML.WALL + BOARD_HTML.NEWLINE
  }
  s += empty_line

  return s
}

// Returns a new board should the move happen
function board_from_move({move, board}) {
  // make a copy of the board
  let board_copy = JSON.parse(JSON.stringify(board))

  const king_r = move.color === COLOR.WHITE ? 7 : 0

  let moving_pawn
  if (move.end[0] === king_r) {
    moving_pawn = move.color === COLOR.WHITE ? BOARD_VALUE.WHITE_KING : BOARD_VALUE.BLACK_KING
  } else {
    moving_pawn = board_copy[move.start[0]][move.start[1]]
  }

  console.log(moving_pawn, move)

  if (move.kind === "normal") {
    board_copy[move.start[0]][move.start[1]] = BOARD_VALUE.NONE
    board_copy[move.end[0]][move.end[1]] = moving_pawn
  } else if (move.kind === "jump") {
    board_copy[move.start[0]][move.start[1]] = BOARD_VALUE.NONE
    board_copy[move.end[0]][move.end[1]] = moving_pawn
    board_copy[move.jumped[0]][move.jumped[1]] = BOARD_VALUE.NONE
  } else {
    console.error("There is something wrong with the move.kind")
  }

  return board_copy
}

// Returns a list of possible movements
function check_moves({board, pawn}) {
  function get_value(r, c) {
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      return board[r][c]
    } else {
      return undefined
    }
  }

  const enemy_pawn = pawn.color === COLOR.WHITE ? BOARD_VALUE.BLACK : BOARD_VALUE.WHITE
  const enemy_king = pawn.color === COLOR.WHITE ? BOARD_VALUE.BLACK_KING : BOARD_VALUE.WHITE_KING

  let drs = [pawn.color === COLOR.WHITE ? 1 : -1]
  if (pawn.rank === "king") {
    drs.push(pawn.color === COLOR.WHITE ? -1 : 1)
  }

  let moves = []
  for (const dr of drs) {
    for (const dc of [-1, 1]) {
      const movement_value = get_value(pawn.r + dr, pawn.c + dc) // might be a problem later with bounds and such.... oh well
      if (movement_value === enemy_pawn || movement_value === enemy_king) {
        const jump_value = get_value(pawn.r + dr * 2, pawn.c + dc * 2)
        if (jump_value === BOARD_VALUE.NONE) {
          moves.push({
            kind: "jump",
            start: [pawn.r, pawn.c],
            jumped: [pawn.r + dr, pawn.c + dc],
            end: [pawn.r + dr * 2, pawn.c + dc * 2],
            color: pawn.color,
            rank: pawn.rank,
          })
        }
      } else if (movement_value === BOARD_VALUE.NONE){
        moves.push({
          kind: "normal",
          start: [pawn.r, pawn.c],
          end: [pawn.r + dr, pawn.c + dc],
          color: pawn.color,
          rank: pawn.rank,
        })
      }
    }
  }

  return moves
}

// TODO: Make this move the game foward/do stuff
function pawn_click({pawn}) {
  let moves = check_moves({board: the_board, pawn})

  const display = create_display({turn: the_turn, board: the_board, winner: the_winner, moves: moves})
  const bindings = create_bindings({turn: the_turn, board: the_board, winner: the_winner, moves: moves})
  const html_string = create_html_string({display, bindings})

  update_board_element({html_string})
}

function move_click({move}) {
  the_board = board_from_move({move, board: the_board})

  let double_jumps
  if (move.kind === "jump") {
    double_jumps = check_moves({board: the_board, pawn: {
      r: move.end[0],
      c: move.end[1],
      color: move.color,
      rank: move.rank,
    }}).filter(move => move.kind === "jump")
  }

  if (double_jumps !== undefined && double_jumps.length > 0) {
    // Draw board and bindings, getting the game started
    const display = create_display({turn: the_turn, board: the_board, winner: the_winner, moves: double_jumps, double_jump: true})
    const bindings = create_bindings({turn: the_turn, board: the_board, winner: the_winner, moves: double_jumps, double_jump: true})
    const html_string = create_html_string({display, bindings})
    update_board_element({html_string})
  } else {
    the_winner = check_winner({board: the_board})
    the_turn = the_turn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE

    if (the_winner !== undefined) {
      update_winner_element({winner: the_winner})
    } else {
      update_turn_element({turn: the_turn})
    }

    // Draw board and bindings, getting the game started
    const display = create_display({turn: the_turn, board: the_board, winner: the_winner, moves: [], double_jump: false})
    const bindings = create_bindings({turn: the_turn, board: the_board, winner: the_winner, moves: [], double_jump: false})
    const html_string = create_html_string({display, bindings})
    update_board_element({html_string})
  }
}

function check_winner({board}) {
  const flat = board.flat()
  const white_number = flat.filter(cell => cell === BOARD_VALUE.WHITE || cell === BOARD_VALUE.WHITE_KING).length
  const black_number = flat.filter(cell => cell === BOARD_VALUE.BLACK || cell === BOARD_VALUE.BLACK_KING).length

  if (white_number === 0) {
    return COLOR.BLACK
  } else if (black_number === 0) {
    return COLOR.WHITE
  } else {
    return undefined
  }
}

function update_turn_element({turn}) {
  turn_element.innerHTML = the_turn === COLOR.WHITE ? "O's Turn" : "X's Turn"
}

function update_board_element({html_string}) {
  board_element.innerHTML = html_string
}

function update_winner_element({winner}) {
  turn_element.innerHTML = `${winner === COLOR.WHITE ? "O" : "X"} is the winner`
}


window.addEventListener('load', function () {
  // TODO: comb through this and delete stuff when you can


  /*const board_element = document.getElementById("board")



  board_element.innerHTML = create_board_string(board)
  console.log(create_board_string(board))

  let black_pawns = document.getElementsByClassName("black-pawn")

  for (const pawn of black_pawns) {
    const r = pawn.getAttribute("_r")
    const c = pawn.getAttribute("_c")
    pawn.onclick = () => {

    }
  }*/

  board_element = document.getElementById("board")
  turn_element = document.getElementById("turn")

  //Draw turn text
  update_turn_element({turn: the_turn})

  // Draw board and bindings, getting the game started
  const display = create_display({turn: the_turn, board: the_board, winner: the_winner, moves: [], double_jump: false})
  const bindings = create_bindings({turn: the_turn, board: the_board, winner: the_winner, moves: [], double_jump: false})
  const html_string = create_html_string({display, bindings})
  update_board_element({html_string})

    // Bind the pawns
    /*const pawns = document.getElementsByClassName(turn === COLOR.WHITE ? "white-pawn" : "black-pawn")
    for (const pawn of pawns) {
      const r = parseInt(pawn.getAttribute("_r"))
      const c = parseInt(pawn.getAttribute("_c"))
      pawn.onclick = () => {
        // TODO: make this work
        // think about bindings, how those will be done...
        // This is a fun problem
        const moves = check_moves({board, r, c})
        const display = display_board_from_moves({moves, board})
        const display_string = create_display_string({display})
        board_element.innerHTML = display_string
      }
    }*/



  // Advance the turn
  //turn = turn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE

  // Ending

})
