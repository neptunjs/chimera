// @flow
import Node from './Node';
import Input from './Input';
import Output from './Output';

class MapLoop extends Node {
    loopNode: Node;

    constructor(node: Node) {
        super();
        this.loopNode = node;
        for (let [key, val] of node.inputs.entries()) {
            const input = new Input(this, {
                name: val.name,
                type: 'array'
            });
            this.inputs.set(key, input);
        }

        for (let [key, val] of node.outputs.entries()) {
            const output = new Output(this, {
                name: val.name,
                type: 'array'
            });
            this.outputs.set(key, output);
        }
    }

    get kind(): string {
        return 'map-loop';
    }

    async run() {
        const key = this.inputs.keys().next().value;
        const outKey = this.outputs.keys().next().value;

        if (!key || !outKey) {
            throw new Error('Undefined input or output');
        }
        const input: any = this.inputs.get(key);
        const value = input.getValue();
        const result = [];
        for (let val of value) {
            this.loopNode.reset();
            this.loopNode.inputs.get(key).setValue(val);
            await
            this.loopNode.run();
            result.push(this.loopNode.outputs.get(outKey).getValue());
        }
        this.outputs.get(outKey).setValue(result);
    }

    inspect() {
        return {
            kind: this.kind,
            id: this.id,
            status: this.status
        };
    }
}

export default MapLoop;
