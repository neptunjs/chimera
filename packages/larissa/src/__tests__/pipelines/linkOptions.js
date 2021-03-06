import Environment from '../../Environment';

describe('link options', function () {
    it('link Block options', async () => {
        const env = new Environment();
        const pipeline = env.newPipeline();
        const number1 = pipeline.newNode('number', {value: 5});
        const number2 = pipeline.newNode('number', {value: 10});
        const sum = pipeline.newNode('sum');
        pipeline.connect(number1, sum);
        pipeline.connect(number2, sum);
        pipeline.linkOutput(sum.output(), 'sumResult');
        pipeline.linkOptions('Number 1', number1);
        pipeline.linkOptions('Number 2', number2);
        pipeline.setOptions({
            'Number 1': {value: 1},
            'Number 2': {value: 2}
        });
        await pipeline.run();
        expect(number1.output().getValue()).toBe(1);
        expect(number2.output().getValue()).toBe(2);
        expect(sum.output().getValue()).toBe(3);
    });

    it('link Pipeline options', async () => {
        const env = new Environment();
        const outPipeline = env.newPipeline();
        const inPipeline = env.newPipeline();
        const number1 = inPipeline.newNode('number', {value: 5});
        const number2 = inPipeline.newNode('number', {value: 10});
        const sum = inPipeline.newNode('sum');
        inPipeline.connect(number1, sum);
        inPipeline.connect(number2, sum);
        inPipeline.linkOutput(sum.output(), 'sumResult');
        inPipeline.linkOptions('Number 1', number1);
        inPipeline.linkOptions('Number 2', number2);

        outPipeline.addNode(inPipeline);
        outPipeline.linkOptions('pInOptions', inPipeline);
        outPipeline.setOptions({
            pInOptions: {
                'Number 1': {value: 1},
                'Number 2': {value: 2}
            }
        });

        await inPipeline.run();
        expect(number1.output().getValue()).toBe(1);
        expect(number2.output().getValue()).toBe(2);
        expect(sum.output().getValue()).toBe(3);
    });

    it('should throw if node is not in pipeline', function () {
        const env = new Environment();
        const pipeline1 = env.newPipeline();
        const pipeline2 = env.newPipeline();
        const number = pipeline2.newNode('number', {value: 5});

        pipeline1.addNode(pipeline2);
        expect(() => pipeline1.linkOptions('option', number)).toThrow(/not found in pipeline/);
    });

    it('should throw when setOptions is passed invalid options', function () {
        const env = new Environment();
        const pipeline = env.newPipeline();
        const number = pipeline.newNode('number', {value: 10});
        pipeline.linkOptions('Number', number);
        expect(() => pipeline.setOptions({
            Number: {value: 1},
            Other: {value: 2}
        })).toThrow(/linked option Other does not exist/);
    });
});

