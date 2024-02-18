import fs from "fs";

const isBdPhone = (value: string) => {
  const bangladeshiNumber = /^(?:\+88|88)?(?:01[3-9]\d{8})$/;
  return bangladeshiNumber.test(value);
};

const isRole = (value: string) => {
  return value === "user" || value === "admin" || value === "super-admin";
};
export { isBdPhone, isRole };

export const removeLocalFiles = (path_or_array_of_path: string | string[]) => {
  if (Array.isArray(path_or_array_of_path)) {
    // array of paths
    path_or_array_of_path.forEach((path) => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });
  } else {
    // single path
    if (fs.existsSync(path_or_array_of_path)) {
      fs.unlinkSync(path_or_array_of_path);
    }
  }
};
