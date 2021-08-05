import fs from 'fs';
import path from 'path';
import Stack from './stack.js';
import { StackAlreadyExistsError, StackDoesNotExistsError } from './errors.js';

let stacks = Stack.loadAll();

const getStacks = () => stacks;

const getStackNames = () => stacks.map(s => s.name);

const getStackByname = (name) => stacks.find(s => s.name === name);

const addNewStack = async (name, origin, isPrivate = false) => {
  if (getStackByname(name)) throw new StackAlreadyExistsError(name);

  // We can either receive a local folder as origin, or a remote github/gitlab/bitbucket repo URL
  // Let's check if origin is a local folder that exists, otherwise assume git repo
  const isLocalFolder = await fs.promises.stat(path.resolve(origin)).catch(() => false);
  const stack = isLocalFolder ?
    await Stack.newFromLocalFolder(name, path.resolve(origin)) :
    await Stack.newFromGit(name, origin, isPrivate);

  stacks.push(stack);
  await Stack.saveAll(stacks);

  return stack;
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
  addNewStack,
  deleteStackByName,
};