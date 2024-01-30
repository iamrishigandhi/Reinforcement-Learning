// Basic JavaScript HTML5 GUI Helper Functions
//
// Author: David Churchill, Memorial University

class RLGUI extends GUI {
    
    constructor(container) {
        super(container);
        
        this.pixelWidth = 720;
        this.pixelHeight = 720;
    
        // the colors used to draw the map
        this.colors = ["#777777", "#1DA1F2", "#0000ff"];
                                                          
        this.mouse = 'print';
        this.doRL = false;
        this.totalIterations = 0;
        this.totalgoal = 1;
        this.frameCount = 0;
        this.minQ = 0;
        this.maxQ = 0;
        this.colorScheme = 'color';
        this.selectX = 0;
        this.selectY = 0;
        
        this.setHTML();
        this.setMap();
        this.resetChart();
        this.addEventListeners();
    }
    
    setMap() {
        let mapElement = document.getElementById('selectmap');
        let map = (mapElement == null) ? 'default' : mapElement.value;
        if      (map == 'default')  { this.env = new Environment(defaultMap); }
        else if (map == 'mini')     { this.env = new Environment(miniMap); }
        else if (map == 'tiny')     { this.env = new Environment(tinyMap); }
        else if (map == 'large')    { this.env = new Environment(largeMap); }
        this.sqSize = this.pixelWidth / this.env.width;
        this.RL = new RL(this.env, this.getConfig());
    }
                                                          
    draw() {
        
        this.frameCount++;
                                                          
        if (this.doRL) {
            
            let updateChart = false;
            let steps = parseInt(document.getElementById('selectiter').value);
            for (let i=0; i < steps; i++) {    
                this.doIteration();
                if (this.totalIterations % 1000 == 0) { updateChart = true; }
            }

            if (this.frameCount % 30 == 0 || updateChart) {
                this.chart.series[0].addPoint([this.totalIterations, this.totalIterations / this.totalgoal])
            }
        }

        this.minQ = this.RL.getMinQ();
        this.maxQ = this.RL.getMaxQ();

        // start the draw timer
        let t0 = performance.now();
        // clear the foreground to white
        this.fg_ctx.clearRect(0, 0, this.bg.width, this.bg.height);
        
        // draw the tiles
        for (let x = 0; x < this.env.width; x++) {
            for (let y = 0; y < this.env.height; y++) {
                switch (this.env.getType(x,y)) {
                    case 'W': this.drawTile(x, y, '#333333'); break;
                    case 'T': this.drawTile(x, y, '#1DA1F2'); break;
                    default: this.drawTile(x, y, '#ffffff'); break;
                }
            }
        }
                                                          
                                                          
        // draw state-action values
        this.fg_ctx.fillStyle = "#000000";
        for (let x = 0; x < this.env.width; x++) {
            for (let y = 0; y < this.env.height; y++) {
                let r = this.env.getType(x,y);
                for (let a = 0; a < this.env.actions.length; a++) {
                    if (r == 'W' || r == 'T') { continue; }
                    this.drawValueTriangle(x, y, a);
                }
            }
        }
                                                          
        // draw horizontal lines
        for (let y = 0; y <= this.env.height; y++) {
            this.drawLine(0, y * this.sqSize + 0.5, this.fg.width, y * this.sqSize + 0.5, '#000000', 1)
            //this.fg_ctx.fillRect(0, y * this.sqSize, this.fg.width, 1);
        }   
        for (let x = 0; x <= this.env.width; x++) {  
            this.drawLine(x * this.sqSize + 0.5, 0, x * this.sqSize + 0.5, this.fg.height, '#000000', 1)
            //this.fg_ctx.fillRect(x * this.sqSize, 0, 1, this.fg.height);
        }
                                                          
        // draw the episode position
        if (this.RL.state[0] != -1) {
            let x = parseInt((this.RL.state[0] + 0.5) * this.sqSize);
            let y = parseInt((this.RL.state[1] + 0.5) * this.sqSize);
            this.drawCircle(x, y, this.sqSize/3, '#0000ff', '#000000', 2)
        }
                                                          
        for (let x = 0; x < this.env.width; x++) {
            for (let y = 0; y < this.env.height; y++) {
                let r = this.env.getType(x,y);
                for (let a = 0; a < this.env.actions.length; a++) {
                    if (r == 'W' || r == 'T') { continue; }
                    this.drawPolicyLine(x, y, this.env.actions[a], this.RL.P[x][y][a]);
                }
            }
        }
                                                          
        let x = this.selectX; let y = this.selectY;
        let rs = 'Reward[<b>' + x + '</b>][<b>' + y + '</b>]: ' + this.env.getReward(x,y).toFixed(3);
        let vs = 'Values[<b>' + x + '</b>][<b>' + y + '</b>]: [';
        for (let a=0; a<4; a++) {
            vs += this.RL.Q[x][y][a].toFixed(3);
            if (a < 3) { vs += ', '; }
        } vs += ']';
        let ps = 'Policy[<b>' + x + '</b>][<b>' + y + '</b>]: [';
        for (let a=0; a<4; a++) {
            ps += this.RL.P[x][y][a].toFixed(3);
            if (a < 3) { ps += ', '; }
        } ps += ']';
        this.infoDiv.innerHTML = '<pre>' + rs + '<br>' + vs + "<br>" + ps + '</pre>';
    }

    drawValueTriangle(x, y, a) {
        let half = 0.5 * this.sqSize;
        let px = parseInt((x + 0.5) * this.sqSize);
        let py = parseInt((y + 0.5) * this.sqSize);
        let action = this.env.actions[a];
        let qvalue = this.RL.Q[x][y][a];
        let color = "#ffffff";

        let spread = this.maxQ - this.minQ;
        let ratio = spread == 0 ? 255 : (qvalue - this.minQ) / spread;
        let c = parseInt(128 - 128 * ratio);

        if (this.colorScheme == 'color') {
            if (qvalue <= 0) {
                ratio = (this.minQ == 0) ? 0 : (qvalue / this.minQ);
                let c = parseInt(255*ratio);
                color = 'rgb(255, ' + (255-c) + ", " + (255-c) + ")";
            } else {
                ratio = (this.maxQ == 0) ? 0 : (qvalue / this.maxQ);
                let c = parseInt(255*ratio);
                color = 'rgb(' + (255-c) + ", 255, " + (255-c) + ")";
            }
        } else {
            color = 'rgb(' + (255-c) + ", " + (255-c) + ", " + (255-c) + ")";
        }

        // up/down moves
        if (action[0] == 0) {
            let y = py + half*action[1];
            let x1 = px - half;
            let x2 = px + half;
            this.drawTriangle(px, py, x1, y, x2, y, color, "#000000", 1);
        // left/right moves
        } else if (action[1] == 0) {
            let x = px + half*action[0];
            let y1 = py - half;
            let y2 = py + half;
            this.drawTriangle(px, py, x, y1, x, y2, color, "#000000", 1);
        }
    }

    drawPolicyLine(x, y, a, p) {
        if (p == 0) { return; }
        let px = parseInt((x + 0.5) * this.sqSize);
        let py = parseInt((y + 0.5) * this.sqSize);
        let width = this.sqSize*a[0] * p * 0.45;
        let height = this.sqSize*a[1] * p * 0.45;
        if (width == 0) { px -= 0.5; height -= 0.5; }
        if (height == 0) { py -= 0.5; width -= 0.5;}
        this.drawLine(px, py, px + width, py + height, '#000000', 1)
        //this.fg_ctx.fillRect(px, py, width, height);
    }

    drawTileValues(x, y, color) {
        this.fg_ctx.fillStyle = color;
        this.fg_ctx.fillRect(x * this.sqSize, y * this.sqSize, this.sqSize, this.sqSize);

        let tlx  = x*this.sqSize;
        let tly  = y*this.sqSize;
        let brx  = (x+1)*this.sqSize;
        let bry  = (y+1)*this.sqSize;
        let midx = (x+0.5)*this.sqSize;
        let midy = (y+0.5)*this.sqSize;

        // up
        this.drawTriangle(tlx, tly, brx, tly, midx, midy, "#00ff00", "#000000", 1);
        //this.drawTriangle(tlx, tly, tlx, bry, midx, midy, "#0000ff", "#000000", 1);
    }

    drawTile(x, y, color) {
        this.fg_ctx.fillStyle = color;
        this.fg_ctx.fillRect(x * this.sqSize, y * this.sqSize, this.sqSize, this.sqSize);
    }

    doIteration() {
        this.RL.config = this.getConfig();
        this.RL.learningIteration();
        if (this.env.isTerminal(this.RL.state[0], this.RL.state[1])) {
            this.totalgoal++;  
        } 
        this.totalIterations++;
    }

    getConfig() {
        return {
            alpha           : parseFloat(document.getElementById('selectstep').value),
            gamma           : parseFloat(document.getElementById('selectgamma').value),
            epsilon         : parseFloat(document.getElementById('selectepsilon').value)
        };
    }
                                                          
    setMouse() {
        this.mouse = document.getElementById('selectmouse').value;
    }

    addEventListeners() {

        this.fg.gui = this;
        this.fg.addEventListener('mousedown', function (evt) {
            let mousePos = this.gui.getMousePos(this.gui.fg, evt);
            let x = Math.floor(mousePos.x / this.gui.sqSize);
            let y = Math.floor(mousePos.y / this.gui.sqSize);
            console.log(x, y);
            if (evt.which == 3) {
                this.gui.RL.state = [x, y]; 
            } else if (evt.which == 2) {
                this.gui.selectX = x;
                this.gui.selectY = y;
            } else if (evt.which == 1) {
                this.gui.selectX = x;
                this.gui.selectY = y;
                if (this.gui.mouse == 'print') {
                    console.log('Reward[' + x + '][' + y + ']:\n', this.gui.env.getReward(x,y));
                    console.log('Values[' + x + '][' + y + ']:\n', this.gui.RL.Q[x][y]);
                    console.log('Policy[' + x + '][' + y + ']:\n', this.gui.RL.P[x][y]);
                } else if (this.gui.mouse == 'wall') { 
                    this.gui.env.setType(x, y, 'W'); 
                    for (let a = 0; a < this.gui.env.actions.length; a++) {
                        this.gui.RL.Q[x][y][a] = 0;
                        this.gui.RL.P[x][y][a] = 1.0 / this.gui.env.actions.length;
                    }
                } else if (this.gui.mouse == 'clear') { 
                    this.gui.env.setType(x, y, 'C'); 
                    for (let a = 0; a < this.gui.env.actions.length; a++) {
                        this.gui.RL.Q[x][y][a] = 0;
                        this.gui.RL.P[x][y][a] = 1.0 / this.gui.env.actions.length;
                    }
                } else if (this.gui.mouse == 'move') { 
                    this.gui.RL.state = [x, y]; 
                } else if (this.gui.mouse == 'goal') { 
                    this.gui.env.setType(x, y, 'T'); 
                    for (let a = 0; a < this.gui.env.actions.length; a++) {
                        this.gui.RL.Q[x][y][a] = 0;
                        this.gui.RL.P[x][y][a] = 1.0 / this.gui.env.actions.length;
                    }
                } else if (this.gui.mouse == 'reward') { 
                    let input = 0;
                    do{
                        input = parseInt(window.prompt("Set Reward for (" + x + "," + y + ")", "0"), 10);
                    } while(isNaN(input)); 
                    this.gui.env.setReward(x, y, input);
                    for (let a = 0; a < this.gui.env.actions.length; a++) {
                        this.gui.RL.Q[x][y][a] = 0;
                        this.gui.RL.P[x][y][a] = 1.0 / this.gui.env.actions.length;
                    }
                }                   
            }
        }, false);
    
        this.fg.oncontextmenu = function (e) {
            e.preventDefault();
        };
    }
                                                          
    setHTML() {
        let top = 0, skip = 40, c2left = 150, s=0;
        this.createCanvas(this.pixelWidth + 1, this.pixelHeight + 1);
        this.bannerDiv  = this.create('div', 'BannerContainer',    this.fg.width + 30,   0, 400,  40);
        this.controlDiv = this.create('div', 'ControlContainer',   this.fg.width + 30,  50, 400, 600);
        this.infoDiv    = this.create('div', 'InfoContainer',      30,  this.fg.height + 20, this.fg.width,  100);
        this.chartDiv   = this.create('div', 'ChartDiv',           740, 380, 600, 440);
        
        this.bannerDiv.innerHTML = "<b>GridWorld Q-Learning - <a href='http://www.cs.mun.ca/~dchurchill/'>David Churchill</a>";
        this.infoDiv.innerHTML = "Click on a tile to see the stats";

        // Map Select
        this.addText(this.controlDiv, 'labelmap', 0, top + s*skip, 250, 25, "Environment:");
        this.addSelectBox(this.controlDiv, 'selectmap', c2left, top + s++*skip, 250, 25, function() { this.gui.setMap(); }, 
            [['default', 'Default Environment'], ['mini', 'Mini Environment'], ['tiny', 'Tiny Environment'], ['large', 'Large Environment']]);

        // Mouse Mode
        this.addText(this.controlDiv, 'labelmouse', 0, top + s*skip, 250, 25, "Mouse Mode:");
        this.addSelectBox(this.controlDiv, 'selectmouse', c2left, top + s++*skip, 250, 25, function() { this.gui.setMouse(); }, 
            [['print', 'Print Values'], ['wall', 'Insert Wall'], ['clear', 'Clear Tile'], ['goal', 'Insert Terminal'], ['reward', 'Set Reward'], ['move', 'Move Agent']]);
                                                          
        // Algorithm Parameters
        this.addText(this.controlDiv, 'labelstep', 0, top + s*skip, 250, 25, "Alpha: ");
        this.addNumberBox(this.controlDiv, 'selectstep', c2left, top + s++*skip, 250, 25, 0.1, 0, 1, 0.1, function() {  });
        this.addText(this.controlDiv, 'labelepsilon', 0, top + s*skip, 250, 25, "Epsilon: ");
        this.addNumberBox(this.controlDiv, 'selectepsilon', c2left, top + s++*skip, 250, 25, 0.1, 0, 1, 0.1, function() {  });
        this.addText(this.controlDiv, 'labelgamma', 0, top + s*skip, 250, 25, "Gamma: ");
        this.addNumberBox(this.controlDiv, 'selectgamma', c2left, top + s++*skip, 250, 25, 1.0, 0, 1, 0.1, function() {  });
        this.addText(this.controlDiv, 'labeliter', 0, top + s*skip, 250, 25, "Iterations: ");
        this.addNumberBox(this.controlDiv, 'selectiter', c2left, top + s++*skip, 250, 25, 1, 1, 100000, 1, function() {  });

        // Buttons
        this.addButton(this.controlDiv, 'toggleButton', 0, top + s*skip, 140, 25, "Toggle Iteration", function() { this.gui.doRL = !this.gui.doRL; });
        this.addButton(this.controlDiv, 'stepButton', 150, top + s++*skip, 140, 25, "Single Iteration", function() { this.gui.doRL = false; this.gui.doIteration(); });
    }
                                                          
    resetChart() {
        this.chart = Highcharts.chart('ChartDiv', {
			chart: { animation: false, zoomType: 'xy', type: 'line' },
			title: { text: 'Average Iterations to Terminal' },
			yAxis: { title: { text: 'Average Iterations' } },
			xAxis: { title: { text: 'Iterations' } },
			legend: { enabled: false },
            series: [{data:[]}]
        });
    }
}
