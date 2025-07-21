// biblicalData.js

const biblicalData = [
  {
    name: 'Adam',
    lat: 33.0,
    lng: 44.0, // Approx. Garden of Eden (Mesopotamia/Iraq)
    ancestors: 'None (created by God)',
    progenitors: 'Seth (and others like Cain, Abel)',
    details: 'First man, lived 930 years. Associated with Eden.',
    age: 930,
    familyTree: `
Adam
└─ Seth
   └─ Enosh
      └─ Kenan
         └─ Mahalalel
            └─ Jared
               └─ Enoch
                  └─ Methuselah
                     └─ Lamech
                        └─ Noah
                           ├─ Shem
                           ├─ Ham
                           └─ Japheth`,
    verses: ['Genesis 5:1-5'],
    color: 'blue', // Pre-flood
  },
  {
    name: 'Seth',
    lat: 33.1,
    lng: 44.2, // Near Eden
    ancestors: 'Adam',
    progenitors: 'Enosh',
    details: 'Son of Adam, lived 912 years.',
    age: 912,
    familyTree: `(Part of Adam's tree: Adam → Seth → ... → Noah)`,
    verses: ['Genesis 5:6-8'],
    color: 'blue',
  },
  {
    name: 'Enosh',
    lat: 33.3,
    lng: 44.0, // Near Eden
    ancestors: 'Seth',
    progenitors: 'Adam',
    details: 'Son of Seth, lived 905 years. Men began to call on the Lord.',
    age: 905,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:9-11'],
    color: 'blue',
  },
  {
    name: 'Kenan', // Cainan
    lat: 33.2,
    lng: 44.5, // Near Eden
    ancestors: 'Enosh',
    progenitors: 'Seth',
    details: 'Son of Enosh, lived 910 years.',
    age: 910,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:12-14'],
    color: 'blue',
  },
  {
    name: 'Mahalalel',
    lat: 32.8,
    lng: 44.1, // Near Eden
    ancestors: 'Kenan',
    progenitors: 'Jared',
    details: 'Son of Kenan, lived 895 years.',
    age: 895,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:15-17'],
    color: 'blue',
  },
  {
    name: 'Jared',
    lat: 33.5,
    lng: 44.3, // Near Eden
    ancestors: 'Mahalalel',
    progenitors: 'Enoch',
    details: 'Son of Mahalalel, lived 962 years.',
    age: 962,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:18-20'],
    color: 'blue',
  },
  {
    name: 'Enoch',
    lat: 33.9,
    lng: 43.8, // Near Eden
    ancestors: 'Jared',
    progenitors: 'Methuselah',
    details: 'Son of Jared, lived 365 years. Walked with God and was taken.',
    age: 365,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:21-24'],
    color: 'blue',
  },
  {
    name: 'Methuselah',
    lat: 32.7,
    lng: 44.7, // Near Eden
    ancestors: 'Enoch',
    progenitors: 'Lamech',
    details: 'Son of Enoch, lived 969 years (longest recorded).',
    age: 969,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:25-27'],
    color: 'blue',
  },
  {
    name: 'Lamech',
    lat: 33.4,
    lng: 44.8, // Near Eden
    ancestors: 'Methuselah',
    progenitors: 'Noah',
    details: 'Son of Methuselah, lived 777 years.',
    age: 777,
    familyTree: `(Part of Adam's tree)`,
    verses: ['Genesis 5:28-31'],
    color: 'blue',
  },
  {
    name: 'Noah',
    lat: 39.7024,
    lng: 44.2991, // Mount Ararat (Turkey/Armenia)
    ancestors: 'Lamech <- ... <- Adam',
    progenitors: 'Shem, Ham, Japheth',
    details: 'Built the ark, lived 950 years. Father of post-flood nations.',
    age: 950,
    familyTree: `Noah
├─ Shem (e.g., Elam, Asshur)
├─ Ham (e.g., Cush, Mizraim, Canaan)
└─ Japheth (e.g., Gomer, Javan)`,
    verses: ['Genesis 5:28-32', 'Genesis 6-9', 'Genesis 10'],
    color: 'green', // Post-flood
  },
  {
    name: 'Shem',
    lat: 32.5,
    lng: 44.3, // Mesopotamia/Ur area (Iraq)
    ancestors: 'Noah',
    progenitors: 'Elam, Asshur, Arphaxad (leading to Abraham), etc.',
    details:
      'Son of Noah, ancestor of Semites (e.g., Hebrews, Arabs). Associated with Middle East peoples.',
    familyTree: `Shem
├─ Elam
├─ Asshur
└─ Arphaxad -> ... -> Abraham`,
    verses: ['Genesis 10:21-31'],
    color: 'green',
  },
  {
    name: 'Ham',
    lat: 30.0,
    lng: 31.0, // Egypt/Canaan region
    ancestors: 'Noah',
    progenitors: 'Cush, Mizraim, Put, Canaan',
    details: 'Son of Noah, ancestor of African and Canaanite peoples.',
    familyTree: `Ham
├─ Cush
├─ Mizraim
└─ Canaan`,
    verses: ['Genesis 10:6-20'],
    color: 'green',
  },
  {
    name: 'Japheth',
    lat: 39.0,
    lng: 35.0, // Anatolia/Black Sea region (Turkey)
    ancestors: 'Noah',
    progenitors: 'Gomer, Magog, Madai, Javan, etc.',
    details:
      'Son of Noah, ancestor of Indo-European peoples (e.g., Greeks, Celts).',
    familyTree: `Japheth
├─ Gomer
└─ Javan`,
    verses: ['Genesis 10:2-5'],
    color: 'green',
  },
  {
    name: 'Elam',
    lat: 32.19,
    lng: 48.25, // Susa, ancient Elam (Iran)
    ancestors: 'Shem <- Noah',
    progenitors: 'Elamites (Persian region peoples)',
    details: 'Son of Shem, associated with Elamite kingdom.',
    familyTree: `(Branch of Shem)`,
    verses: ['Genesis 10:22'],
    color: 'green',
  },
  {
    name: 'Asshur',
    lat: 36.36,
    lng: 43.16, // Nineveh, Assyria (Iraq)
    ancestors: 'Shem <- Noah',
    progenitors: 'Assyrians',
    details: 'Son of Shem, founder of Assyrian empire.',
    familyTree: `(Branch of Shem)`,
    verses: ['Genesis 10:22'],
    color: 'green',
  },
  {
    name: 'Cush',
    lat: 9.0,
    lng: 38.0, // Ethiopia/Sudan region
    ancestors: 'Ham <- Noah',
    progenitors: 'Nimrod (Babylon), other Ethiopian peoples',
    details: 'Son of Ham, associated with Cushite kingdoms (e.g., Ethiopia).',
    familyTree: `(Branch of Ham)`,
    verses: ['Genesis 10:6-8'],
    color: 'green',
  },
  {
    name: 'Mizraim',
    lat: 30.04,
    lng: 31.24, // Cairo, Egypt
    ancestors: 'Ham <- Noah',
    progenitors: 'Egyptians (Philistines from Caphtorim branch)',
    details: 'Son of Ham, ancestor of Egyptians.',
    familyTree: `(Branch of Ham)`,
    verses: ['Genesis 10:6,13-14'],
    color: 'green',
  },
  {
    name: 'Canaan',
    lat: 31.77,
    lng: 35.21, // Jerusalem, Canaan
    ancestors: 'Ham <- Noah',
    progenitors: 'Hittites, Jebusites, Amorites, etc.',
    details: 'Son of Ham, ancestor of Canaanite peoples.',
    familyTree: `(Branch of Ham)`,
    verses: ['Genesis 10:15-19'],
    color: 'green',
  },
  {
    name: 'Gomer',
    lat: 45.0,
    lng: 34.0, // Crimea/Cimmeria region
    ancestors: 'Japheth <- Noah',
    progenitors: 'Ashkenaz, Riphath, Togarmah (Celtic/Germanic peoples)',
    details: 'Son of Japheth, associated with Cimmerians.',
    familyTree: `(Branch of Japheth)`,
    verses: ['Genesis 10:2-3'],
    color: 'green',
  },
  {
    name: 'Javan',
    lat: 37.96,
    lng: 23.72, // Athens, Greece (Ionia)
    ancestors: 'Japheth <- Noah',
    progenitors:
      'Elishah, Tarshish, Kittim, Dodanim (Greeks, maritime peoples)',
    details: 'Son of Japheth, ancestor of Greeks and islanders.',
    familyTree: `(Branch of Japheth)`,
    verses: ['Genesis 10:2,4'],
    color: 'green',
  },
]

export default biblicalData
