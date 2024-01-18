// Basic JavaScript HTML5 GUI Helper Functions
//
// Author: David Churchill, Memorial University

class GUI {

    constructor(container) {
        this.container = container;
    }

    create(type, id, left, top, width, height) {
        let elem = document.createElement(type);
        elem.id = id;
        elem.style.position = 'absolute';
        if (left != 0) { elem.style.left = left; }
        if (top != 0) { elem.style.top = top; }
        if (height != 0) {
            if (type === 'canvas') {
                elem.height = height;
            } else {
                elem.style.height = height;
            }
        }
        if (width != 0) {
            if (type === 'canvas') {
                elem.width = width;
            } else {
                elem.style.width = width;
            }
        }
        this.container.appendChild(elem);
        return elem;
    }

    createCanvas(width, height) {
        this.bg = this.create('canvas', 'bg', 0, 0, width, height);
        this.fg = this.create('canvas', 'fg', 0, 0, width, height);
        this.bg_ctx = this.bg.getContext("2d");
        this.fg_ctx = this.fg.getContext("2d");
        this.fg_ctx.font = '14px Arial';
    }

    getMousePos(canvas, evt) {
        let rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
                                                          
    createElement(type, id, left, top, width, height) {
        let element = document.createElement(type);
        element.id = id;
        element.gui = this;
        element.style.position = 'absolute';
        element.style.left = left;
        element.style.top = top;
        element.style.width = width;
        element.style.height = height;
        return element;
    }

    addButton(container, id, left, top, width, height, label, onclick) {
        let button = this.createElement('button', id, left, top, width, height);
        button.innerHTML = label;
        button.onclick = onclick;
        container.appendChild(button);
    }

    addText(container, id, left, top, width, height, label) {
        let div = this.createElement('div', id, left, top, width, height);
        div.innerHTML = label;
        container.appendChild(div);
    }
                                                          
    // adds a Select box to the given container
    // values: [[val1, desc1], [val2, desc2]]
    addSelectBox(container, id, left, top, width, height, onchange, values) {
        let select = this.createElement('select', id, left, top, width, height);
        select.onchange = onchange;
        for (let i = 0; i < values.length; i++) {
            let option = document.createElement("option");
            option.value = values[i][0];
            option.text = values[i][1];
            select.appendChild(option);
        }
        container.appendChild(select);
    }

    addSlider(container, id, left, top, width, height, value, min, max, onchange) {
        let slider = this.createElement('input', id, left, top, width, height);
        slider.type = 'range';
        slider.value = value;
        slider.min = min;
        slider.max = max;
        slider.oninput = onchange;
        container.appendChild(slider);
    }
                                                          
    addNumberBox(container, id, left, top, width, height, value, min, max, step, onchange) {
        let slider = this.createElement('input', id, left, top, width, height);
        slider.type = 'number';
        slider.value = value;
        slider.style.textAlign = 'center';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.oninput = onchange;
        container.appendChild(slider);
    }
                                                          
    showElements(ids) {
        for (let i = 0; i < ids.length; i++) {
            document.getElementById(ids[i]).style.display = 'inline';
        }
    }

    hideElements(ids) {
        for (let i = 0; i < ids.length; i++) {
            document.getElementById(ids[i]).style.display = 'none';
        }
    }

    drawTriangle(x1, y1, x2, y2, x3, y3, fillColor, borderColor, borderWidth) {
        this.fg_ctx.beginPath();
        this.fg_ctx.moveTo(x1, y1);
        this.fg_ctx.lineTo(x2, y2);
        this.fg_ctx.lineTo(x3, y3);
        this.fg_ctx.closePath();
                                                          
        this.fg_ctx.lineWidth = borderWidth;
        this.fg_ctx.strokeStyle = borderColor;
        //this.fg_ctx.stroke();

        this.fg_ctx.fillStyle = fillColor;
        this.fg_ctx.fill();
    }

    drawLine(x1, y1, x2, y2, color, width) {
        
        this.fg_ctx.beginPath();
        this.fg_ctx.moveTo(x1, y1);
        this.fg_ctx.lineTo(x2, y2);
        
        this.fg_ctx.strokeStyle = color;
        this.fg_ctx.lineWidth = width;
        this.fg_ctx.stroke();
    }

    drawCircle(x, y, radius, fillColor, borderColor, borderWidth) {
        this.fg_ctx.fillStyle = fillColor;
        this.fg_ctx.strokeStyle = borderColor;
        this.fg_ctx.lineWidth = borderWidth;
        this.fg_ctx.beginPath();
        this.fg_ctx.arc(x, y, radius, 0, 2*Math.PI, false);
        this.fg_ctx.fill();
        this.fg_ctx.stroke();
    }
}