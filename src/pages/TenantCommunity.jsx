import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Users, Heart, MessageCircle, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function PostCard({ post, currentUser, onLike, onComment, comments }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const liked = post.likes?.includes(currentUser?.email);
  const postComments = comments.filter(c => c.post_id === post.id);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await base44.entities.CommunityComment.create({
      post_id: post.id,
      body: commentText.trim(),
      author_name: currentUser?.full_name || "Tenant",
      author_email: currentUser?.email,
    });
    setCommentText("");
    setSubmitting(false);
    onComment();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      {post.pinned && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">📌 Pinned</span>
      )}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
          {(post.author_name || "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{post.author_name || "Resident"}</p>
          <p className="text-xs text-muted-foreground">{new Date(post.created_date).toLocaleDateString()}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed">{post.body}</p>
      {post.image_url && <img src={post.image_url} alt="post" className="rounded-lg max-h-64 object-cover w-full" />}
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onLike(post)} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500" : ""}`} />
          <span>{post.likes?.length || 0}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{postComments.length}</span>
        </button>
      </div>
      {showComments && (
        <div className="space-y-2 pt-2 border-t border-border">
          {postComments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                {(c.author_name || "?")[0].toUpperCase()}
              </div>
              <div className="bg-secondary rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold">{c.author_name}</p>
                <p className="text-xs mt-0.5">{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Textarea rows={1} value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..." className="text-sm resize-none flex-1" />
            <Button size="icon" onClick={submitComment} disabled={submitting || !commentText.trim()} className="rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenantCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const [p, c] = await Promise.all([
      base44.entities.CommunityPost.list("-created_date"),
      base44.entities.CommunityComment.list("-created_date"),
    ]);
    setPosts(p.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.created_date) - new Date(a.created_date)));
    setComments(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitPost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    await base44.entities.CommunityPost.create({
      body: newPost.trim(),
      author_name: user?.full_name || "Resident",
      author_email: user?.email,
      likes: [],
    });
    setNewPost("");
    setPosting(false);
    load();
  };

  const handleLike = async (post) => {
    const likes = post.likes || [];
    const hasLiked = likes.includes(user?.email);
    const newLikes = hasLiked ? likes.filter(e => e !== user?.email) : [...likes, user?.email];
    await base44.entities.CommunityPost.update(post.id, { likes: newLikes });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-700">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect with neighbors and stay updated</p>
      </div>

      {/* New Post */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <Textarea rows={3} value={newPost} onChange={e => setNewPost(e.target.value)}
          placeholder="Share something with the community..." className="resize-none" />
        <div className="flex justify-end">
          <Button onClick={submitPost} disabled={posting || !newPost.trim()} className="gap-2">
            <Plus className="w-4 h-4" />{posting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No community posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to post something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => (
            <PostCard key={p.id} post={p} currentUser={user} onLike={handleLike} onComment={load} comments={comments} />
          ))}
        </div>
      )}
    </div>
  );
}