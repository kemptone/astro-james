export const bad_stuff = [
  'passing notes in class',
  'lighting a girls hair on fire',
  'disrupting the school play',
  'making loud noises',
  'changing the settings on the teachers ipad',
  'Talking while the teacher is speaking',
  'Not following instructions',
  'Interrupting classmates',
  'Throwing paper or objects',
  'Using rude words',
  'Not doing homework',
  'Drawing on the desk',
  'Running around the classroom',
  'Teasing or making fun of others',
  'Refusing to participate in group work',
  'Ignoring classroom rules',
  'Playing with toys during lessons',
  'Arguing with the teacher',
  'Cheating on a test',
  'Refusing to share supplies',
  'Making loud noises',
  'Using a tablet or phone without permission',
  "Hiding another student's belongings",
  'Lying about completing assignments',
  'Talking back to the teacher',
  'Daydreaming and not paying attention',
  'Passing notes during class',
  'Mocking the teacher or imitating them disrespectfully',
  'Purposely spilling or making a mess',
  'Stealing another student’s items',
  'Pretending to be sick to avoid work',
  'Rolling eyes at the teacher or classmates',
  'Faking injuries for attention',
  'Sneaking snacks during lessons',
  'Making faces at the teacher or classmates',
  'Banging on desks or furniture loudly',
  'Complaining about assignments excessively',
  'Refusing to line up properly',
  'Shoving or pushing in line',
  'Making sarcastic or disrespectful comments',
  'Whispering secrets during quiet time',
  'Throwing tantrums when not getting their way',
  'Refusing to take turns during activities',
  'Blaming others for their own mistakes',
]

export const ways_to_get_caught = [
  'CCTV cameras',
  'Witnesses reporting',
  'Phone tracking',
  'Social media posts',
  'Forensic evidence',
  'Confessing accidentally',
  'Leaving fingerprints',
  'Emails being traced',
  'Texts being recovered',
  'Bank account activity',
  'GPS location tracking',
  'Surveillance drones',
  'Neighbors hearing noise',
  'Security alarms triggering',
  'Forgotten physical evidence',
  'License plate recognition',
  'Hacked digital devices',
  'Colleague reporting',
  'Facial recognition technology',
  'Data leaks',
  'Accidental recorded audio',
  'Public records revealing inconsistencies',
  'Forgetting to delete search history',
  'Fake alibi being disproven',
  'Security guards noticing',
  'Camera footage being reviewed',
  'Mistaking undercover officers',
  'Being spotted in a reflection',
  'Incriminating photos',
  'Phone apps revealing location',
  'Leaving DNA evidence',
  'Clothing matching descriptions',
  'Witness testimony',
  'Smart home devices recording',
  'Traffic cameras',
  'Forgetting to cover online tracks',
  'Web browsing activity traced',
  'Using identifiable tools',
  'Anonymous tip-offs',
  'Filing fraudulent documents',
  'Accidental confession in conversation',
  'Phone calls being traced',
  'Email metadata',
  'Writing down incriminating notes',
  'Sharing details with too many people',
  'Disgruntled accomplices revealing',
  'Time-stamped receipts',
  'Being caught in the act',
  'Mistaking someone as an ally',
  'Overconfidence and slip-ups',
  'Patterns in behavior',
  'Security tags triggering alarms',
  'Video conferencing mishaps',
  'Bluetooth devices revealing location',
  'Cloud backups exposing files',
  'Smartwatch health data',
  'Failing to disable motion sensors',
  'Forgetting to mask identity',
  'Random police checks',
  'Underestimating law enforcement',
  'Mistakes in execution',
  'Online purchases being tracked',
  'Digital payment trails',
  'Social engineering failures',
  'Corrupted storage revealing data',
  'Phone number tracing',
  'Returning to the scene of the act',
  'Devices syncing incriminating info',
  'Traffic ticket timestamps',
  'Leaked private conversations',
  'Accidental online confessions',
  'Unaware of undercover investigation',
  'Friends or family reporting',
  'Employer discovering suspicious activity',
  'Patterns in travel history',
  'Unexpected audits',
  'Data breaches revealing secrets',
  'Leaving behind personal items',
  'Forgetfulness during cover-ups',
  'Unwarranted attention on social media',
  "Contradicting one's own story",
  'Police bait operations',
  'Fake websites collecting info',
  'Security checkpoints',
  'Associating with suspicious individuals',
  'AI analyzing data patterns',
  'Smartphone apps syncing data',
  'Voice identification',
  'Accidental live streams',
  'Security vulnerabilities in devices',
  'Neighbors capturing video',
  'Mistaken identity unraveling',
  'Drone footage',
  'Online bragging',
  'Ex-partners reporting out of spite',
  'Random inspections',
  'Document inconsistencies',
  'Police profiling',
  'Being too predictable',
  'Failing to use encryption',
]

export const behavior_cards = [
  'none',
  'double rainbow',
  'rainbow',
  'yellow card',
  'green card',
  'orange card',
  'red card',
  'dark purple card',
  'black card',
  'dead meat',
  'ultra dead meat',
]

export const behavior_score = ['1', '2', '3', '4', '5', '6']

export function getRandomBehavior() {
  const randomIndex = Math.floor(Math.random() * bad_stuff.length)
  return bad_stuff[randomIndex]
}

export function randomFromArray(arr: string[]) {
  const randomIndex = Math.floor(Math.random() * arr.length)
  return arr[randomIndex]
}
