// state/marketApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


export type Users = { id: string; name: string; rating: number; reviews: number };

export type Item = {
  id: string;
  title: string;
  brief: string;
  bountyUSD: number;
  timeLeft: string | null; 
  complexity: 'Easy' | 'Medium' | 'Hard';
  stack: string[];
  authorId: string;
  author: Users;
  stats?: { files: number; loc: number; tests?: number };
  saved?: boolean;
};



export type CreateItemInput = {
  title: string;
  brief: string;
  bountyUSD: number;
  timeLeft?: string | null;              
  complexity: 'Easy' | 'Medium' | 'Hard';
  stack: string[];
  stats?: { files: number; loc: number; tests?: number };
};

type GetItemsArg = {
  q?: string;
  stacks?: string[];
  complexities?: ('Easy'|'Medium'|'Hard')[];
  sort?: 'relevance'|'bountyDesc'|'newest';
};

// If you have auth in Redux, use RootState to grab userId or token
type RootState = { auth?: { userId?: string } };

export const marketApi = createApi({
  reducerPath: 'marketApi',
  baseQuery: fetchBaseQuery({
    // IMPORTANT: use the router mount path as baseUrl.
    // If your Express app uses `app.use('/explore', router)`, then set:
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/explore',
    prepareHeaders: (headers, { getState }) => {
      const userId = (getState() as RootState)?.auth?.userId;
      if (userId) headers.set('x-user-id', userId); // your server reads this
      return headers;
    },
  }),
  tagTypes: ['Items', 'Item'],
  endpoints: (builder) => ({

    // BASE: GET /explore  (no filters)
    getBase: builder.query<Item[], void>({
      query: () => ({ url: '' }), // '' -> GET /explore
      providesTags: (res) =>
        res ? [{ type: 'Items', id: 'LIST' }, ...res.map(i => ({ type: 'Item' as const, id: i.id }))] 
            : [{ type: 'Items', id: 'LIST' }],
    }),

    // FILTERS: GET /explore/sort?q=&stacks=&complexities=&sort=
    getReviews: builder.query<Item[], GetItemsArg>({
      query: ({ q, stacks, complexities, sort }) => {
        const qs = new URLSearchParams();
        if (q) qs.set('q', q);
        if (stacks?.length) qs.set('stacks', stacks.join(','));
        if (complexities?.length) qs.set('complexities', complexities.join(','));
        if (sort) qs.set('sort', sort);
        return { url: `sort?${qs.toString()}` };
      },
      providesTags: (res) =>
        res ? [{ type: 'Items', id: 'LIST' }, ...res.map(i => ({ type: 'Item' as const, id: i.id }))] 
            : [{ type: 'Items', id: 'LIST' }],
    }),

    // DETAIL: GET /explore/:id
    getItem: builder.query<Item, string>({
      query: (id) => ({ url: `${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Item', id }],
    }),

    // CREATE: POST /explore/create
    createReview: builder.mutation<Item, CreateItemInput>({
      query: (body) => ({ url: 'create', method: 'POST', body }),
      invalidatesTags: [{ type: 'Items', id: 'LIST' }],
    }),

    // DELETE: DELETE /explore/item/:id
    deleteReview: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `item/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Item', id }, { type: 'Items', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetBaseQuery,         // GET /explore
  useGetReviewsQuery,      // GET /explore/sort?... 
  useGetItemQuery,         // GET /explore/:id
  useCreateReviewMutation, // POST /explore/create
  useDeleteReviewMutation, // DELETE /explore/item/:id
} = marketApi;
