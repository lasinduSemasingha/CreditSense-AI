import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

export type EmailTemplateName =
  | "verify-email";

type RenderOptions = {
  template: EmailTemplateName;
  data?: Record<string, unknown>;
};

const TEMPLATE_DIR = path.join(process.cwd(), "templates");

function readTemplateFile(templateName: string): string {
  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, "utf8");
}

export function renderTemplate({ template, data = {} }: RenderOptions): string {
  const source = readTemplateFile(template);
  const compiled = Handlebars.compile(source);
  return compiled(data);
}


