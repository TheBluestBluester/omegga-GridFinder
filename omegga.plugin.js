
let playerLists = {};

const clr = {
msg: "[<color=\"9bf\">Grid finder</>] - ",
err: "[<color=\"f52\">Grid finder</>] - "

};

let timeoutList = [];

let allowedRoles = [];
let cooldownTime = 1;

module.exports = class Plugin {
	constructor(omegga, config, store) {
		this.omegga = omegga;
		this.config = config;
		this.store = store;
		
		allowedRoles = this.config.PermittedRoles;
		cooldownTime = this.config.UsageCooldown;
		
	}
	
	async GetDynamicGrids(lastToFirst, toCheck) {
		try{
		const reg = new RegExp(`BrickGridDynamicActor.+_(?<GridId>.+)\.OwnerId = (?<OwnerId>.+)`);
		
		const data = await this.omegga.addWatcher(reg, {
			exec: () =>
			this.omegga.writeln(
				`GetAll BrickGridDynamicActor OwnerId`
			),
			first: 'index',
			timeoutDelay: 200,
			bundle: true
		});
		
		let gridList = [];
		for(let i in data) {
			const groups = data[i].groups;
			const ownerId = Number(groups.OwnerId);
			if(toCheck >= 0 && ownerId != toCheck) continue;
			gridList.push({id: groups.GridId, ownerId: ownerId});
		}
		
		if (lastToFirst) return gridList;
		return gridList.reverse();
		
		}catch(e){console.log(e)}
	}
	
	async GetGridLocation(gridId) {
		try{
		const reg = new RegExp(`BrickGridComponent.+RelativeLocation =.+X=(?<X>.+),Y=(?<Y>.+),Z=(?<Z>.+).`);
		
		const data = await this.omegga.addWatcher(reg, {
			exec: () =>
			this.omegga.writeln(
				`GetAll BrickGridComponent RelativeLocation Outer=BrickGridDynamicActor_${gridId}`
			),
			first: 'index',
			timeoutDelay: 500
		});
		
		return [Number(data[0].groups.X), Number(data[0].groups.Y), Number(data[0].groups.Z)];
		
		}catch(e){console.log(e)}
		
	}
	
	async GetEntityLocation(entityName, entityID) {
		try{
		const reg = new RegExp(`BRSpherePhysicsStaticMeshComponent.+RelativeLocation =.+X=(?<X>.+),Y=(?<Y>.+),Z=(?<Z>.+).`);
		
		const data = await this.omegga.addWatcher(reg, {
			exec: () =>
			this.omegga.writeln(
				`GetAll MeshComponent RelativeLocation Outer=${entityName}_${entityID}` // GetAll StaticMesh RelativeLocation Outer=${entityName}_${entityID}
			),
			first: 'index',
			timeoutDelay: 500
		});
		
		return [Number(data[0].groups.X), Number(data[0].groups.Y), Number(data[0].groups.Z)];
		
		}catch(e){console.log(e)}
		
	}
	
	async GetAllEntities(lastToFirst, toCheck) {
		try{
		const reg = new RegExp(`.+PersistentLevel.BP_Entity_(?<EntityName>.+)_C_(?<EntityID>\\d+).OwnerId = (?<OwnerID>\\d+)`);
		
		const data = await this.omegga.addWatcher(reg, {
			exec: () =>
			this.omegga.writeln(
				`GetAll BREntityActor OwnerId`
			),
			first: 'index',
			timeoutDelay: 200,
			bundle: true
		});
		
		let entityList = [];
		for(let i in data) {
			const groups = data[i].groups;
			const ownerId = Number(groups.OwnerID);
			if(toCheck >= 0 && ownerId != toCheck) continue;
			entityList.push({name: groups.EntityName.replace(/Wheel_/, ""), trueName: groups.EntityName, id: groups.EntityID, ownerId: ownerId});
		}
		
		if (lastToFirst) return entityList;
		return entityList.reverse();
		
		}catch(e){console.log(e)}
		
	}
	
	async GetBrickOwnerTable() {
		try{
		const reg = new RegExp(`.+OwnerName="(?<Name>.+)",OwnerDisplayName="(?<DisplayName>.+)"`);
		
		const data = await this.omegga.addWatcher(reg, {
			exec: () =>
			this.omegga.writeln(
				`GetAll BP_GameStateBase_C BrickOwnerTable`
			),
			first: 'index',
			timeoutDelay: 100,
			bundle: true,
			debounce: true
		});
		
		let ownerList = [];
		for(let i in data) {
			const groups = data[i].groups;
			ownerList.push({name: groups.Name, displayName: groups.DisplayName});
		}
		
		return ownerList;
		
		//console.log(data);
		}catch(e){console.log(e)}
	}
	
	
	checkRoles = (name) => {
		
		const player = this.omegga.getPlayer(name);
		
		if(player.isHost()) return true;
		
		const roles = player.getRoles();
		for(let i in roles) {
			
			if(allowedRoles.includes(roles[i])) return true;
			
		}
		
		return false
		
	}
	
	removeTimeout = (name) => {
		
		delete timeoutList[name];
		
	}
	
	fuzzyMatch = (toCheck, target) => {
		
		const item = toCheck.name.toLowerCase();
		let score = 0;
		
		for(let c = 0; c < item.length; c++) {
			
			const itemChar = item.charAt(c);
			const targetChar = target.charAt(c);
			if(itemChar == targetChar) {
				score++;
			}
			else {
				break;
			}
			
		}
		
		return score;
		
	}
	
	fuzzySearch = (list, target) => {
		
		const targetLowerCase = target.toLowerCase();
		
		let highestScore = 0;
		let bestMatchInd = -1;
		
		for(let i in list) {
			
			const score = this.fuzzyMatch(list[i], targetLowerCase);
			
			if(score > highestScore) {
				
				bestMatchInd = i;
				highestScore = score;
				
			}
			
		}
		
		return bestMatchInd;
		
	}
	
	async init() {
		// Write your plugin!
		
		this.omegga.on('cmd:getgrids', async (name, ...args) => {
			
			if(!this.checkRoles(name)) {
				this.omegga.whisper(name, clr.err + "You do not have the permission to use this command!");
				return;
			}
			
			if(name in timeoutList) {
				this.omegga.whisper(name, clr.err + `You need to wait ${cooldownTime} second(s) before using the command again.`)
				return;
			}
			
			const invertOrder = args.includes("last");
			let ownerToCheck = -1;
			const argInd = args.findIndex((e) => e.includes("owner:"));
			
			this.omegga.whisper(name, clr.msg + "Fetching grids...");
			
			const brickOwners = await this.GetBrickOwnerTable();
			if(brickOwners == null) {
				
				this.omegga.whisper(name, clr.err + "Failed to get brick owners.")
				return;
				
			};
			
			if(argInd >= 0) {
				
				let target = args[argInd].replace(/owner:/, "");
				if(target == "self") target = (await this.omegga.findPlayerByName(name)).displayName;
				
				ownerToCheck = this.fuzzySearch(brickOwners, target);
				
			}
			
			const grids = await this.GetDynamicGrids(invertOrder, ownerToCheck);
			if(!grids) {
				this.omegga.whisper(name, clr.err + "Failed to fetch grids.");
				return;
			}
			
			let gridList = [];
			
			let decrement = 0;
			for(let i in grids) {
				
				const grid = grids[i];
				const gridLoc = await this.GetGridLocation(grid.id);
				const gridOwner = brickOwners[grid.ownerId].displayName;
				
				let ind = Number(i) + 1;
				if(invertOrder) ind = grids.length - Number(i);
				
				this.omegga.whisper(name, clr.msg + `(${ind}) <b>Location:</> ${Math.floor(gridLoc[0])}, ${Math.floor(gridLoc[1])}, ${Math.floor(gridLoc[2])} <b>Owner:</> ${gridOwner}`);
				
				gridList.push({id: grid.id, ownerId: grid.ownerId, loc: gridLoc});
				
			}
			
			if(gridList.length == 0) {
				this.omegga.whisper(name, clr.err + "No grids have been found!");
				return;
			}
			
			playerLists[name] = gridList;
			
			timeoutList[name] = setTimeout(() => this.removeTimeout(name), cooldownTime * 1000);
			
		})
		.on('cmd:tptogrid', async (name, ...args) => {
			
			if(!this.checkRoles(name)) {
				this.omegga.whisper(name, clr.err + "You do not have the permission to use this command!");
				return;
			}
			
			if(!(playerLists[name])) {
				this.omegga.whisper(name, clr.err + "You don't have a list of grids stored! Run /getgrids to store the grids.");
				return;
			}
			
			const index = Number(args[0]);
			const listLen = playerLists[name].length;
			
			if(isNaN(index) || index > listLen || index < 1) {
				this.omegga.whisper(name, clr.err + "You need to input a valid index.");
				return;
			}
			
			const gridLoc = playerLists[name][index - 1].loc;
			
			this.omegga.writeln(`Chat.Command /TP "${name}" ${gridLoc[0]} ${gridLoc[1]} ${gridLoc[2]} 0`)
			
		})
		.on('cmd:getents', async (name, ...args) => {
			
			if(!this.checkRoles(name)) {
				this.omegga.whisper(name, clr.err + "You do not have the permission to use this command!");
				return;
			}
			
			if(name in timeoutList) {
				this.omegga.whisper(name, clr.err + `You need to wait ${cooldownTime} second(s) before using the command again.`)
				return;
			}
			
			const invertOrder = args.includes("last");
			let ownerToCheck = -1;
			const argInd = args.findIndex((e) => e.includes("owner:"));
			
			this.omegga.whisper(name, clr.msg + "Fetching entities...");
			
			const brickOwners = await this.GetBrickOwnerTable();
			if(brickOwners == null) {
				
				this.omegga.whisper(name, clr.err + "Failed to get brick owners.")
				return;
				
			};
			
			if(argInd >= 0) {
				
				let target = args[argInd].replace(/owner:/, "");
				if(target == "self") target = (await this.omegga.findPlayerByName(name)).displayName;
				
				ownerToCheck = this.fuzzySearch(brickOwners, target);
				
			}
			
			let entities = await this.GetAllEntities(invertOrder, ownerToCheck);
			if(!entities) {
				this.omegga.whisper(name, clr.err + "Failed to fetch entities.");
				return;
			}
			
			const filterInd = args.findIndex((e) => e.includes("type:"));
			if(filterInd >= 0) {
				
				let target = args[filterInd].replace(/type:/, "").toLowerCase();
				entities = entities.filter((e) => this.fuzzyMatch(e, target) >= target.length);
				
			}
			
			let entList = [];
			
			let decrement = 0;
			for(let i in entities) {
				
				const entity = entities[i];
				const entityName = "BP_Entity_" + entity.trueName + "_C";
				const entityLoc = await this.GetEntityLocation(entityName, entity.id);
				const entityOwner = brickOwners[entity.ownerId].displayName;
				
				let ind = Number(i) + 1;
				if(invertOrder) ind = entities.length - Number(i);
				
				this.omegga.whisper(name, clr.msg + `(${ind}) <b>Name:</> ${entity.name} <b>Location:</> ${Math.floor(entityLoc[0])}, ${Math.floor(entityLoc[1])}, ${Math.floor(entityLoc[2])} <b>Owner:</> ${entityOwner}`);
				
				entList.push({id: entity.id, ownerId: entity.ownerId, loc: entityLoc});
				
			}
			
			if(entList.length == 0) {
				this.omegga.whisper(name, clr.err + "No entities have been found!");
				return;
			}
			
			playerLists[name] = entList;
			
			timeoutList[name] = setTimeout(() => this.removeTimeout(name), cooldownTime * 1000);
			
		});

		return { registeredCommands: ['getgrids', 'tptogrid', 'getents'] };
	}

	async stop() {
		// Anything that needs to be cleaned up...
		for(let i in timeoutList) {
			clearTimeout(timeoutList[i]);
		}
		
	}
}
