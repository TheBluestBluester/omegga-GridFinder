<!--

When uploading your plugin to github/gitlab
start your repo name with "omegga-"

example: https://github.com/Bluester16/omegga-GridFinder

Your plugin will be installed via omegga install gh:Bluester16/GridFinder

-->

# GridFinder

Allows you to locate physics objects!

## Install

`omegga install gh:TheBluestBluester/GridFinder`

## Usage

### /getgrids (last) (owner:(name))

Fetches all the grids. Running this command is necessary for /tptogrid to work.

Args:

`last`: Lists grids from last to first.

`owner:(name)` Lists grids of a specified player. **Does not use display names.**

### /getents (last) (owner:(name)) (type:(name))

Fetches all the entities. Also works with /tptogrid.

Args:

`last`: Lists entities from last to first.

`owner:(name)` Lists entities of a specified player. **Does not use display names.**

`type:(name)` Lists entities of a specific type.

### /tptogrid (index)

Teleports you to the specified grid.

Args:

`index`: The index of the grid on the /getgrids list.
