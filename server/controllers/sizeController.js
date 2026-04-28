import sizeService from "../services/sizeService.js";

export const createSize = async (req, res) => {
  try {
    const size = await sizeService.createSize(req.body);
    res.status(201).json(size);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getSizes = async (req, res) => {
  try {
    const sizes = await sizeService.getAllSizes();
    res.status(200).json(sizes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSize = async (req, res) => {
  try {
    const size = await sizeService.updateSize(req.params.id, req.body);
    res.status(200).json(size);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSize = async (req, res) => {
  try {
    await sizeService.deleteSize(req.params.id);
    res.status(200).json({ message: "Size deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
