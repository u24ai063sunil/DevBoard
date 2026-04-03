class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;           // Mongoose query e.g. Project.find()
    this.queryString = queryString; // req.query e.g. { status: 'active', sort: '-createdAt' }
  }

  // ── 1. Filtering ─────────────────────────────────────────────────
  filter() {
    const queryObj = { ...this.queryString };

    // Remove special fields that aren't filters
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering: convert gte/gt/lte/lt to MongoDB operators
    // URL: ?priority=high&estimatedHours[gte]=5
    // Becomes: { priority: 'high', estimatedHours: { $gte: 5 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this; // return this for method chaining
  }

  // ── 2. Search ─────────────────────────────────────────────────────
  search() {
    if (this.queryString.search) {
      // Uses the text index we created on the model
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }
    return this;
  }

  // ── 3. Sorting ────────────────────────────────────────────────────
  sort() {
    if (this.queryString.sort) {
      // URL: ?sort=-createdAt,priority
      // Mongoose needs: '-createdAt priority' (space-separated)
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default: newest first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // ── 4. Field limiting ─────────────────────────────────────────────
  limitFields() {
    if (this.queryString.fields) {
      // URL: ?fields=name,status,priority
      // Only return those fields — saves bandwidth
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // always exclude __v
    }
    return this;
  }

  // ── 5. Pagination ─────────────────────────────────────────────────
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // URL: ?page=2&limit=5 → skip 5, take 5
    this.query = this.query.skip(skip).limit(limit);

    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = ApiFeatures;