class RL {

    constructor(env, config) {
        this.config = config;   // learning configuration settings (alpha, gamma, epsilon)
                                // this.config.alpha   = learning rate
                                // this.config.gamma   = discount factor
                                // this.config.epsilon = e-greedy chance to select random action

        this.env = env;         // the environment we will learn about
            
        this.Q = [];            // values array Q[x][y][a] =       value of doing action a at state (x,y)
        this.P = [];            // policy array P[x][y][a] = probability of doing action a at state (x,y)
        
        this.state = [0, 0];    // the current location (state) of the agent on the map
        this.init();
    }
    
    init() {
        // initialize all Q values to 0
        for (let x=0; x<this.env.width; x++) {
            this.Q.push([]);
            for (let y=0; y<this.env.height; y++) {
                this.Q[x].push([]);
                for (let a=0; a<this.env.actions.length; a++) {
                    this.Q[x][y].push(0);
                }
            }
        }

        // initialize Policy to equiprobable actions
        for (let x=0; x<this.env.width; x++) {
            this.P.push([]);
            for (let y=0; y<this.env.height; y++) {
                this.P[x].push([]);
                for (let a=0; a<this.env.actions.length; a++) {
                    this.P[x][y].push(1.0 / this.env.actions.length);
                }
            }
        }
    }
    
    learningIteration() {
        // Keep updating the state until a non-terminal state is reached
        while (this.env.isTerminal(this.state[0], this.state[1])) {
            this.state = [Math.floor(Math.random() * this.env.width), Math.floor(Math.random() * this.env.height)];
        }
    
        // Select an action based on the policy
        let actionIndex = this.selectActionFromPolicy(this.state);
    
        let nextState = this.env.getNextState(this.state[0], this.state[1], actionIndex);
        let reward = this.env.getReward(this.state[0], this.state[1], actionIndex);
        this.updateValue(this.state, actionIndex, reward, nextState);
        this.updatePolicy(this.state);
    
        // Move to the next state
        this.state = nextState;
    }
    
    selectActionFromPolicy(state) {
        let x = state[0];
        let y = state[1];
        let epsilon = this.config.epsilon;
        let maxValueActionIndex = 0;
    
        if (Math.random() < epsilon) {
            return Math.floor(Math.random() * this.env.actions.length);
        } else {
            let maxProbability = -Infinity;
            let maxProbabilityActions = [];
    
            for (let a = 0; a < this.env.actions.length; a++) {
                if (this.P[x][y][a] > maxProbability) {
                    maxProbability = this.P[x][y][a];
                    maxProbabilityActions = [a];
                } else if (this.P[x][y][a] === maxProbability) {
                    maxProbabilityActions.push(a);
                }
            }

            // Randomly choose from actions with the highest probability
            maxValueActionIndex = maxProbabilityActions[Math.floor(Math.random() * maxProbabilityActions.length)];
        }
    
        return maxValueActionIndex;
    }
    
    updateValue(state, action, reward, nextState) {
        let x = state[0];
        let y = state[1];
        let alpha = this.config.alpha;
        let gamma = this.config.gamma;
    
        let currQ = this.Q[x][y][action];
    
        // Update Q-value
        let nextMaxQval = -Infinity;
        for (let a = 0; a < this.env.actions.length; a++) {
            nextMaxQval = Math.max(nextMaxQval, this.Q[nextState[0]][nextState[1]][a]);
        }
        this.Q[x][y][action] = currQ + alpha * (reward + gamma * nextMaxQval - currQ);
    }
    
    updatePolicy(state) {
        let x = state[0];
        let y = state[1];
        let maxActionValue = -Infinity;
    
        // Find the maximum action val for the given state
        for (let a = 0; a < this.env.actions.length; a++) {
            maxActionValue = Math.max(maxActionValue, this.Q[x][y][a]);
        }
    
        let maxActions = [];
    
        // Find actions that have the maximum action val
        for (let a = 0; a < this.env.actions.length; a++) {
            if (this.Q[x][y][a] === maxActionValue) {
                maxActions.push(a);
            }
        }
    
        // Update the policy probabilities based on the max action vals
        for (let a = 0; a < this.env.actions.length; a++) {
            if (maxActions.includes(a)) {
                this.P[x][y][a] = 1.0 / maxActions.length;
            } else {
                this.P[x][y][a] = 0;
            }
        }
    }    
    
    // used by GUI, do not modify
    getMinQ() {
        let min = 10000000;
        for (let x=0; x<this.env.width; x++) {
            for (let y=0; y<this.env.height; y++) {
                for (let a=0; a<this.env.actions.length; a++) {
                    if (this.env.getType(x, y) == 'C' && this.Q[x][y][a] < min) { min = this.Q[x][y][a]; }
                }
            }
        }
        return min;
    }

    // used by GUI
    getMaxQ() {
        let max = -10000000;
        for (let x=0; x<this.env.width; x++) {
            for (let y=0; y<this.env.height; y++) {
                for (let a=0; a<this.env.actions.length; a++) {
                    if (this.env.getType(x, y) == 'C' && this.Q[x][y][a] > max) { max = this.Q[x][y][a]; }
                }
            }
        }
        return max;
    }
}