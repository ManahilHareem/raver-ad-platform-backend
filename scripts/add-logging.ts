import * as fs from 'fs';
import * as path from 'path';

const modulesPath = path.join(__dirname, '../src/modules');

const getFiles = (dir: string, fileList: string[] = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file === 'controller.ts') {
      fileList.push(filePath);
    }
  }
  return fileList;
};

const controllers = getFiles(modulesPath);

controllers.forEach((file) => {
  let content = fs.readFileSync(file, 'utf-8');
  // Avoid duplicating if already exists
  if (!content.includes('console.error(error);')) {
    content = content.replace(/} catch \(error\) {/g, '} catch (error) {\n    console.error(error);');
    // For auth service where error is typed as 'any', it's `catch (error: any) {`
    content = content.replace(/} catch \(error: any\) {/g, '} catch (error: any) {\n    console.error(error);');
    fs.writeFileSync(file, content);
  }
});
console.log('Successfully added logging to all controllers.');
