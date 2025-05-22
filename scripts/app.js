// Este archivo contiene el código JavaScript que maneja la lógica del lado del cliente. 
// Puede incluir funciones para interactuar con el DOM y manejar eventos.

document.addEventListener('DOMContentLoaded', function() {
    const matrixSizeSelect = document.getElementById('matrix-size');
    const numStepsInput = document.getElementById('num-steps');
    const matrixInputsDiv = document.getElementById('matrix-inputs');
    const vectorInputsDiv = document.getElementById('vector-inputs');
    const form = document.getElementById('markov-form');
    const resultDiv = document.getElementById('markov-result');

    function createMatrixInputs(size) {
        matrixInputsDiv.innerHTML = '';
        const label = document.createElement('div');
        label.style.marginBottom = '0.5em';
        label.style.fontWeight = '500';
        label.textContent = 'Matriz de transición (Pij = P(siguiente=j | actual=i)):';
        matrixInputsDiv.appendChild(label);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${size}, 80px)`;
        grid.style.gap = '10px';
        grid.style.justifyContent = 'center';
        grid.style.marginBottom = '1em';

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.style.display = 'flex';
                cell.style.flexDirection = 'column';
                cell.style.alignItems = 'center';

                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.min = '0';
                input.max = '1';
                input.required = true;
                input.style.width = '60px';
                input.style.textAlign = 'center';
                input.name = `m_${i}_${j}`;

                const lbl = document.createElement('span');
                lbl.textContent = `P(${i+1},${j+1})`;
                lbl.style.fontSize = '0.95em';
                lbl.style.color = '#7c3aed';
                lbl.style.marginBottom = '3px';

                cell.appendChild(lbl);
                cell.appendChild(input);
                grid.appendChild(cell);
            }
        }
        matrixInputsDiv.appendChild(grid);
    }

    function createVectorInputs(size) {
        vectorInputsDiv.innerHTML = '';
        const label = document.createElement('div');
        label.style.marginBottom = '0.5em';
        label.style.fontWeight = '500';
        label.textContent = 'Vector de estado inicial:';
        vectorInputsDiv.appendChild(label);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${size}, 80px)`;
        grid.style.gap = '10px';
        grid.style.justifyContent = 'center';

        for (let i = 0; i < size; i++) {
            const cell = document.createElement('div');
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.alignItems = 'center';

            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.required = true;
            input.style.width = '60px';
            input.style.textAlign = 'center';
            input.name = `v_${i}`;

            const lbl = document.createElement('span');
            lbl.textContent = `P(${i+1})`;
            lbl.style.fontSize = '0.95em';
            lbl.style.color = '#7c3aed';
            lbl.style.marginBottom = '3px';

            cell.appendChild(lbl);
            cell.appendChild(input);
            grid.appendChild(cell);
        }
        vectorInputsDiv.appendChild(grid);
    }

    function getMatrix(size) {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                const val = parseFloat(form[`m_${i}_${j}`].value);
                row.push(val);
            }
            matrix.push(row);
        }
        return matrix;
    }

    function getVector(size) {
        const vector = [];
        for (let i = 0; i < size; i++) {
            const val = parseFloat(form[`v_${i}`].value);
            vector.push(val);
        }
        return vector;
    }

    // Multiplica un vector por una matriz (v * M)
    function multiplyVectorMatrix(vector, matrix) {
        const result = [];
        for (let j = 0; j < matrix.length; j++) {
            let sum = 0;
            for (let i = 0; i < vector.length; i++) {
                sum += vector[i] * matrix[i][j];
            }
            result.push(sum);
        }
        return result;
    }

    // Multiplica dos matrices (A * B)
    function multiplyMatrices(a, b) {
        const size = a.length;
        const result = [];
        for (let i = 0; i < size; i++) {
            result[i] = [];
            for (let j = 0; j < size; j++) {
                let sum = 0;
                for (let k = 0; k < size; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    // Eleva la matriz a la potencia n (M^n)
    function powerMatrix(matrix, n) {
        let result = matrix.map((row, i) => row.map((_, j) => (i === j ? 1 : 0))); // Matriz identidad
        let base = matrix;
        while (n > 0) {
            if (n % 2 === 1) {
                result = multiplyMatrices(result, base);
            }
            base = multiplyMatrices(base, base);
            n = Math.floor(n / 2);
        }
        return result;
    }

    // Validaciones Markov
    function validateMatrix(matrix) {
        const size = matrix.length;
        for (let i = 0; i < size; i++) {
            let rowSum = 0;
            for (let j = 0; j < size; j++) {
                const val = matrix[i][j];
                if (isNaN(val) || val < 0 || val > 1) {
                    return `Todos los valores de la matriz deben estar entre 0 y 1.`;
                }
                rowSum += val;
            }
            if (Math.abs(rowSum - 1) > 0.0001) {
                return `La suma de la fila ${i + 1} de la matriz debe ser 1.`;
            }
        }
        return null;
    }

    function validateVector(vector) {
        let sum = 0;
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            if (isNaN(val) || val < 0 || val > 1) {
                return `Todos los valores del vector deben estar entre 0 y 1.`;
            }
            sum += val;
        }
        if (Math.abs(sum - 1) > 0.0001) {
            return `La suma del vector de estado inicial debe ser 1.`;
        }
        return null;
    }

    function showResult(vector) {
        resultDiv.style.color = "#fff";
        resultDiv.style.fontSize = "1.5em";
        resultDiv.style.fontWeight = "bold";
        resultDiv.innerHTML = 'Resultado: [' + vector.map(x => x.toFixed(4)).join(', ') + ']';
    }

    function showError(msg) {
        resultDiv.style.color = "red";
        resultDiv.textContent = msg;
    }

    function updateInputs() {
        const size = parseInt(matrixSizeSelect.value, 10);
        createMatrixInputs(size);
        createVectorInputs(size);
        resultDiv.textContent = '';
    }

    matrixSizeSelect.addEventListener('change', updateInputs);

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const size = parseInt(matrixSizeSelect.value, 10);
        const steps = parseInt(numStepsInput.value, 10) || 1;
        const matrix = getMatrix(size);
        const vector = getVector(size);

        // Validaciones
        let error = validateMatrix(matrix);
        if (error) {
            showError(error);
            return;
        }
        error = validateVector(vector);
        if (error) {
            showError(error);
            return;
        }
        if (isNaN(steps) || steps < 1) {
            showError("El número de pasos debe ser un entero mayor o igual a 1.");
            return;
        }

        // Cálculo Markov: v * (M^n)
        const matrixPow = powerMatrix(matrix, steps);
        const result = multiplyVectorMatrix(vector, matrixPow);
        showResult(result);
    });

    // Inicializa con el tamaño seleccionado
    updateInputs();
});