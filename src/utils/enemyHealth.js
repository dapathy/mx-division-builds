const baseStats = {
	normal: {
		health: 796347,
		armor: 0,
	},
	veteran: {
		health: 796347,
		armor: 995433
	},
	elite: {
		health: 796347,
		armor: 1990868,
	}
}

const difficultyScaling = {
	normal: 1,
	hard: 1.55,
	challenging: 2.1,
	heroic: 3.55,
	legendary: 3.9,
}

// index is the number of players in the group - 1
const groupScaling = [
	{
		normal: 1,
		veteran: 1,
		elite: 1
	},
	{
		normal: 1.2,
		veteran: 1.2,
		elite: 1.271
	},
	{
		normal: 1.44,
		veteran: 1.418,
		elite: 1.483
	},
	{
		normal: 1.73,
		veteran: 1.658,
		elite: 1.709
	}
]

function calculateHealthAndArmor() {


	return {
		health: 0,
		armor: 0
	}
}

export default calculateHealthAndArmor;
