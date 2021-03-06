// @flow
import jsonSchemaDefaults from 'json-schema-defaults';

import Node, {INSTANTIATED, READY} from './Node';
import Input from './InputPort';
import Output from './OutputPort';
import Context from './BlockContext';

import type {BlockType} from './BlockTypes';
import type {NodeStatus} from './Node';

export default class Block extends Node {
    blockType: BlockType;
    options: Object;

    constructor(blockType: BlockType, options: ?Object, id: ?string) {
        super(id);
        this.blockType = blockType;
        if (options) {
            this.options = options;
        } else if (blockType.schema) {
            this.options = jsonSchemaDefaults(blockType.schema);
        } else {
            this.options = {};
        }

        createAllPorts(this);
        this.title = this.blockType.name;
        this.computeStatus();
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

    _computeStatus(): NodeStatus {
        if (!this._canRun()) {
            return INSTANTIATED;
        }
        return READY;
    }

    async _run() {
        const context = new Context(this);
        if (!this._canRun()) {
            throw new Error('options do not satisfy validation rules');
        }
        return this.blockType.executor(context);
    }

    setOptions(options: Object, merge: boolean = true) {
        if (merge) {
            this.options = Object.assign({}, this.options, options);
        } else {
            this.options = Object.assign({}, options);
        }
        this.reset();
    }

    inspect() {
        return {
            node: this.toJSON(),
            status: this.status,
            inputs: this.inputs,
            outputs: this.outputs
        };
    }

    toJSON() {
        return {
            kind: this.kind,
            id: this.id,
            type: this.blockType.identifier,
            options: this.options,
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
