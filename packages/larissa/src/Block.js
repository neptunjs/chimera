// @flow
import Node from './Node';
import Input from './InputPort';
import Output from './OutputPort';
import Context from './BlockContext';

import type {BlockType} from './BlockTypes';

export default class Block extends Node {
    blockType: BlockType;
    options: Object;

    constructor(blockType: BlockType, options: ?Object, id: ?string) {
        super(id);
        this.blockType = blockType;
        this.options = options || {};
        createAllPorts(this);
        this.title = this.blockType.name;
    }

    get kind(): string {
        return 'block';
    }

    _canRun(): boolean {
        if (this.blockType.validator) {
            return this.blockType.validator(this.options);
        }
        return true;
    }

    async _run(options: Object = {}) {
        const context = new Context(this, options);
        if (!this._canRun()) {
            throw new Error('options do not satisfy validation rules');
        }
        return this.blockType.executor(context);
    }

    setOptions(options: Object) {
        this.options = options;
        this.reset();
    }

    inspect() {
        return {
            node: this.toJSON(),
            inputs: this.inputs,
            outputs: this.outputs
        };
    }

    toJSON() {
        return {
            kind: this.kind,
            id: this.id,
            type: this.blockType.name,
            blockType: this.blockType,
            options: this.options,
            status: this.status,
            title: this.title
        };
    }
}

function createAllPorts(self: Block): void {
    createPorts(self, 'inputs', self.inputs, self.blockType.inputs, Input);
    createPorts(self, 'outputs', self.outputs, self.blockType.outputs, Output);
}

// todo change Constructor and P to an interface?
function createPorts<P>(self: Block, type: string, map: Map<string, P>, list: Array<Object>, Constructor: Class<any>) {
    let hasDefaultPort = false;
    for (const portDef of list) {
        const portName = portDef.name;
        const port = new Constructor(self, portDef);
        if (portDef.multiple) {
            port.multiple = true;
        }
        map.set(portName, port);
        if (list.length === 1) {
            if (type === 'inputs') self.defaultInput = port;
            else if (type === 'outputs') self.defaultOutput = port;
        }
        if (portDef.default) {
            if (hasDefaultPort) {
                throw new Error(`cannot have more than one default ${type}`);
            } else {
                hasDefaultPort = true;
                if (type === 'inputs') self.defaultInput = port;
                else if (type === 'outputs') self.defaultOutput = port;
            }
        }
    }
}
