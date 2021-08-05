import Stack from './stack.js';
import { StackAlreadyExistsError, StackDoesNotExistsError } from './errors.js';

let stacks = Stack.loadAll();

const getStacks = () => stacks;

const getStackNames = () => stacks.map(s => s.name);

const getStackByname = (name) => stacks.find(s => s.name === name);

const addStackFromGit = async (name, gitRepoUrl, isPrivate = false) => {
  if (getStackByname(name)) throw new StackAlreadyExistsError(name);

  const stack = await Stack.newFromGit(name, gitRepoUrl, isPrivate);
  stacks.push(stack);

  await Stack.saveAll(stacks);
};

const deleteStackByName = async (name) => {
  const stack = getStackByname(name);
  if (!stack) throw new StackDoesNotExistsError(name);
  if (stack.predefined) throw new Error(`Stack ${name} is predefined and cant be removed`);

  await stack.cleanup();

  stacks = stacks.filter(s => s.name !== name);
  await Stack.saveAll(stacks);
};

export {
  getStacks,
  getStackNames,
  getStackByname,
  addStackFromGit,
  deleteStackByName,
};