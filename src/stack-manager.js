const Stack = require('./stack');

let stacks = Stack.loadAll();

const getStacks = () => stacks;

const getStackNames = () => stacks.map(s => s.name);

const getStackByname = (name) => stacks.find(s => s.name === name);

const addStackFromGit = async (name, gitRepoUrl, isPrivate = false) => {
  if (getStackByname(name)) throw new Error(`Stack ${name} already exists`);

  const stack = await Stack.newFromGit(name, gitRepoUrl, isPrivate);
  stacks.push(stack);

  await Stack.saveAll(stacks);
};

const deleteStackByName = async (name) => {
  const stack = getStackByname(name);
  if (!stack) throw new Error(`Stack ${name} does not exists`);
  if (stack.predefined) throw new Error(`Stack ${name} is predefined and cant be removed`);

  await stack.cleanup();

  stacks = stacks.filter(s => s.name !== name);
  await Stack.saveAll(stacks);
};

module.exports = {
  getStacks,
  getStackNames,
  getStackByname,
  addStackFromGit,
  deleteStackByName,
};