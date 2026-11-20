export const questionLimit = 1200
export const replyLimit = 4000
export const historyLimit = 6

export interface ChatTurn {
  question: string
  reply: string
}
