module.exports = {
	
	add(vec1, vec2) {
		
		const res = [vec1[0] + vec2[0], vec1[1] + vec2[1], vec1[2] + vec2[2]];
		return res;
		
	},
	sub(vec1, vec2) {
		
		const res = [vec1[0] - vec2[0], vec1[1] - vec2[1], vec1[2] - vec2[2]];
		return res;
		
	},
	mult(vec, amount) {
		
		const res = [vec[0] * amount, vec[1] * amount, vec[2] * amount];
		return res;
		
	},
	div(vec, amount) {
		
		const res = [vec[0] / amount, vec[1] / amount, vec[2] / amount];
		return res;
		
	},
	floor(vec) {
		
		const res = [Math.floor(vec[0]), Math.floor(vec[1]), Math.floor(vec[2])];
		return res;
		
	},
	len(vec) {
		
		const res = Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
		return res;
		
	},
	abs(vec) {
		
		const res = [Math.abs(vec[0]), Math.abs(vec[1]), Math.abs(vec[2])];
		return res;
		
	}
	
}