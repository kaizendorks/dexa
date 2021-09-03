import fs from 'fs';
import path from 'path';
import Stack from './stack.js';
import { confirm } from './user-prompts.js';
import { StackAlreadyExistsError, StackDoesNotExistsError } from './errors.js';

let stacks = await Stack.loadAll();

const getStacks = () => stacks;

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

const ensureStackFromProject = async (project) => {
  // Load the stack
  // It is possible that the stack does not exist locally (if the project was created by someone else or if the stack has been deleted)
  let stack = getStackByname(project.stackReference.name);
  if (stack) return stack;

  // If the stack isnt installed locally, ask the user to confirm and install it
  const shouldDownloadStack = await confirm(`The stack ${project.stackReference.name} is not installed locally. Do you want to add it?`);
  if (!shouldDownloadStack) return;

  stack = await addNewStack(project.stackReference.name, project.stackReference.origin, project.stackReference.private);
  return stack;
};

// to be used only in integrationTests in order to faciliate cleanup (without having to execute dx stack delete commands, which is more expensive)
const __reloadStacks = async() => {
  stacks = await Stack.loadAll();
}

export {
  getStacks,
  getStackByname,
  addNewStack,
  deleteStackByName,
  ensureStackFromProject,
  __reloadStacks
};