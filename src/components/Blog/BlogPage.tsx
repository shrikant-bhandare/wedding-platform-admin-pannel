import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, Loader, FileText, Globe, FileLock, Tag, Calendar, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';
import CreateBlogModal from './CreateBlogModal';
import { getUploadUrl } from '../../utils/imageUrl';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  status: string;
  views: number;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [editBlog, setEditBlog] = useState<BlogPost | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page, limit: ITEMS_PER_PAGE };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await adminApi.getBlogs(params);
      const blogsData = response.data?.posts || response.data?.data || response.data || [];
      setBlogs(Array.isArray(blogsData) ? blogsData : []);
    } catch (err: any) {
      console.error('Error loading blogs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [page, statusFilter, categoryFilter]);

  const handleSearch = () => {
    setPage(1);
    loadBlogs();
  };

  const handleView = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setShowViewModal(true);
  };

  const handleEdit = (blog: BlogPost) => {
    setEditBlog(blog);
    setShowCreateModal(true);
  };

  const handleDeleteConfirm = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedBlog) return;
    setActionLoading(true);
    try {
      await adminApi.deleteBlog(selectedBlog._id);
      setShowDeleteModal(false);
      setSelectedBlog(null);
      loadBlogs();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete blog post');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats
  const totalPosts = blogs.length;
  const publishedPosts = blogs.filter(b => b.status === 'PUBLISHED').length;
  const draftPosts = blogs.filter(b => b.status === 'DRAFT').length;
  const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);

  // Filter
  const filteredBlogs = blogs.filter(blog => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return blog.title.toLowerCase().includes(q) ||
        blog.category?.toLowerCase().includes(q) ||
        blog.excerpt?.toLowerCase().includes(q);
    }
    return true;
  });

  // Paginate
  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const paginatedBlogs = filteredBlogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-500 mt-1">Create, edit and manage blog posts</p>
        </div>
        <button
          onClick={() => { setEditBlog(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={loadBlogs} className="text-red-700 hover:text-red-800 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <p className="text-2xl font-bold text-green-600">{publishedPosts}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">{draftPosts}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileLock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">{totalViews}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Categories</option>
            <option value="Wedding Planning">Wedding Planning</option>
            <option value="Venue Selection">Venue Selection</option>
            <option value="Budget Tips">Budget Tips</option>
            <option value="Decorations">Decorations</option>
            <option value="EMI Guide">EMI Guide</option>
            <option value="Food & Catering">Food & Catering</option>
            <option value="Photography">Photography</option>
          </select>
        </div>
      </div>

      {/* Blog Posts Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No blog posts found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first blog post to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {blog.featuredImage ? (
                          <img src={getUploadUrl(blog.featuredImage)} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{blog.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{blog.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        {blog.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{blog.views || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(blog.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleView(blog)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(blog)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteConfirm(blog)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredBlogs.length)} of {filteredBlogs.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-lg text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-lg text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateBlogModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditBlog(null); }}
        onSuccess={loadBlogs}
        editData={editBlog}
      />

      {/* View Modal */}
      {showViewModal && selectedBlog && (
        <Modal title={selectedBlog.title} isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedBlog(null); }} size="xl">
          <div className="space-y-4">
            {selectedBlog.featuredImage && (
              <img src={getUploadUrl(selectedBlog.featuredImage)} alt="" className="w-full h-48 object-cover rounded-lg" />
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBlog.status)}`}>
                {selectedBlog.status}
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3" /> {selectedBlog.category}
              </span>
              <span className="text-sm text-gray-500">{selectedBlog.views} views</span>
              <span className="text-sm text-gray-500">{formatDate(selectedBlog.createdAt)}</span>
            </div>
            {selectedBlog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBlog.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{tag}</span>
                ))}
              </div>
            )}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Excerpt:</h4>
              <p className="text-gray-600">{selectedBlog.excerpt}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Content:</h4>
              <div className="prose max-w-none text-sm text-gray-600 max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: selectedBlog.content }} />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => { setShowViewModal(false); handleEdit(selectedBlog); }}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => { setShowViewModal(false); handleDeleteConfirm(selectedBlog); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && selectedBlog && (
        <Modal title="Delete Blog Post" isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedBlog(null); }} size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>"{selectedBlog.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedBlog(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BlogPage;
