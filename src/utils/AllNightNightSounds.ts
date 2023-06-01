export const AllSounds = `
001_night_night.wav
002_sleep_tight.wav
003_dont_let_the_bed_bugs_bite.wav
004_see_you_later.wav
005_see_you_later_aligator.wav
006_in_a_while_crockodile.wav
007_not_if_I_dont_see_you_first.wav
008_ok.wav
009_I_love_you.wav
010_I_sawsue.wav
011_vasbedonia.wav
012_adios.wav
013_adios_muchachos.wav
014_ok2.wav
015_pleasant_dreams.wav
016_goodnight_pebbels.wav
017_goodnight_roxie.wav
018_goodnight_skip.wav
019_goodnight_turkey.wav
020_goodnight_mommy.wav
021_goodnight_daddy.wav
022_goodnight_grandma_and_grandpa.wav
023_goodnight_my_love.wav
024_goodnight_sweet_prince.wav
025_ok_then.wav
026_pleasant_dreams_I_love_you.wav
027_good_night.wav
028_pleasant_dreams_b.wav
029_good_day_sir.wav
030_I_said_good_day_sir.wav
`.replaceAll(" ", "").replaceAll("\n", "").split(".wav").filter((s) =>
  s !== ""
);
