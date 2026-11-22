# Pokémon base stats, Generations I–VI

The source is [Pokémon with stats](https://www.kaggle.com/datasets/abcsds/pokemon).
The [original CSV snapshot](https://github.com/kdopenshaw/databook/blob/8b6673b/pokemon-book/data/Pokemon.csv)
has 800 rows and 721 distinct National Dex numbers, 1 through 721.
SHA-256 is `02eabc49d3c70bc1e150891bdb9acb254910adfdfc12a6020c7b7117b2eca32f`.

```sh
git show 8b6673b:pokemon-book/data/Pokemon.csv > /tmp/Pokemon.csv
python3 src/data/transforms/build-pokemon.py /tmp/Pokemon.csv
```

The transform keeps the first row in source order for each National Dex number
as a proxy for the base form. It keeps the primary type and all six base stats.
Dual-type Pokémon contribute only to their first listed type. Legendary status
uses the source flag, which can differ from other classifications. Base stats
are game parameters. They do not measure competitive performance.

The distribution uses 50-point bins and divides each group's bin counts by
that group's size (46 legendary and 675 other). Speed is a species-weighted mean
within each primary type. The radar compares a curated set of twelve Pokémon on
the same 0–250 scale for each stat.
