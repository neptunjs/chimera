import Environment from '../../Environment';

test('pipeline toJSON and new from JSON', async () => {
    const env = new Environment();
    const pipeline = env.newPipeline();
    const number1 = pipeline.newNode('number', {value: 5});
    const number2 = pipeline.newNode('number', {value: 10});
    const sum = pipeline.newNode('sum');
    pipeline.connect(number1, sum);
    pipeline.connect(number2, sum);
    await pipeline.run();
    expect(number1.output().getValue()).toBe(5);
    expect(number2.output().getValue()).toBe(10);
    expect(sum.output().getValue()).toBe(15);

    const json = JSON.stringify(pipeline);
    const newPipeline = env.pipelineFromJSON(JSON.parse(json));
    await newPipeline.run();

    const newNumber1 = newPipeline.findNode(number1.id);
    const newNumber2 = newPipeline.findNode(number2.id);
    const newSum = newPipeline.findNode(sum.id);
    expect(newNumber1.output().getValue()).toBe(5);
    expect(newNumber2.output().getValue()).toBe(10);
    expect(newSum.output().getValue()).toBe(15);

    expect(newNumber1).not.toBe(number1);
    expect(newNumber2).not.toBe(number2);
    expect(newSum).not.toBe(sum);
});
