import React from 'react'
import './test.css'

export default () => (
  <main>
    <div className="py-36"></div>
    <div
      className='
        bg-red-500
        hover:(bg-blue-500 text-blue)
        md:(bg-green-500 c-yellow-700)
        lg:(bg-green-800 c-yellow-300)
      '
    >
      Fard, is great
    </div>
    <h1>Test</h1>

    <div
      className='
         bg-red-500 c-yellow-400
        hover:(bg-blue-500 c-yellow-100)
        md:(bg-green-500 c-yellow-700)
        lg:(bg-green-800 c-yellow-300)
      '
    >
      Fardo the lop
    </div>
    <div className=''>Fardo the lop, froggo</div>
  </main>
)
